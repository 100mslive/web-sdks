import { HlsPlayerStats, HlsStats } from '@100mslive/hls-stats';
import Hls, { ErrorData, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSPlayerEventEmitter, HMSHLSPlayerListeners, IHMSHLSPlayerEventEmitter } from './events';
import { HMSHLSTimedMetadata } from './HMSHLSTimedMetadata';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import IHMSHLSPlayer from '../interfaces/IHMSHLSPlayer';
import { ILevel } from '../interfaces/ILevel';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';
import { mapLevel, mapLevels } from '../utilies/utils';

export class HMSHLSPlayer implements IHMSHLSPlayer, IHMSHLSPlayerEventEmitter {
  private hls: Hls;
  private hlsUrl: string;
  private hlsStats: HlsStats;
  private videoEl: HTMLVideoElement;
  private _emitter: HMSHLSPlayerEventEmitter;
  private _subscribeHlsStats?: (() => void) | null = null;
  private _isLive: boolean;
  private _volume: number;
  private _metaData: HMSHLSTimedMetadata;
  /**
   * Initiliaze the player with hlsUrl and video element
   * @remarks If video element is not passed, we will create one and call a method getVideoElement get element
   * @param hlsUrl required - Pass hls url to
   * @param videoEl optional field - HTML video element
   */
  constructor(hlsUrl: string, videoEl?: HTMLVideoElement) {
    this.hls = new Hls(this.getPlayerConfig());
    this._emitter = new HMSHLSPlayerEventEmitter();
    this.hlsUrl = hlsUrl;
    this.videoEl = videoEl || this.createVideoElement();
    if (!hlsUrl) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound();
    }
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(this.videoEl);
    this._isLive = true;
    this._volume = this.videoEl.volume * 100;
    this.hlsStats = new HlsStats(this.hls, this.videoEl);
    this.listenHLSEvent();
    this._metaData = new HMSHLSTimedMetadata(this, this.hls);
    this.seekToLivePosition();
  }
  /**
   * @remarks It will create a video element with playiniline true.
   * @returns HTML video element
   */
  private createVideoElement(): HTMLVideoElement {
    if (this.videoEl) {
      return this.videoEl;
    }
    const video: HTMLVideoElement = document?.createElement('video');
    video.playsInline = true;
    video.controls = false;
    video.autoplay = true;
    video.style.height = '100%';
    video.style.margin = 'auto';
    return video;
  }
  /**
   * @returns get html video element
   */
  getVideoElement(): HTMLVideoElement {
    return this.videoEl;
  }
  /**
   * @returns return custom list of events
   */
  static get Events(): typeof HMSHLSPlayerEvents {
    return HMSHLSPlayerEvents;
  }
  /**
   *  Subscribe to hls stats
   */
  subscribeStats = (callback: (state: HlsPlayerStats) => void, interval = 2000) => {
    this._subscribeHlsStats = this.hlsStats.subscribe((state: HlsPlayerStats) => {
      callback(state);
    }, interval);
    return this.unsubscribeStats;
  };
  /**
   * Unsubscribe to hls stats
   */
  unsubscribeStats = () => {
    if (this._subscribeHlsStats) {
      this._subscribeHlsStats();
    }
  };
  // reset the controller
  reset() {
    if (this.hls && this.hls.media) {
      this.hls.detachMedia();
      this.unsubscribeStats();
    }
    if (this._metaData) {
      this._metaData.unregisterListener();
    }
    if (Hls.isSupported()) {
      this.hls.off(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.off(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.off(Hls.Events.ERROR, this.handleHLSException);
    }
    if (this.videoEl) {
      this.videoEl.removeEventListener('play', this.playEventHandler);
      this.videoEl.removeEventListener('pause', this.pauseEventHandler);
      this.videoEl.removeEventListener('timeupdate', this.handleTimeUpdateListener);
      this.videoEl.removeEventListener('volumechange', this.volumeEventHandler);
    }
  }
  on<E extends keyof HMSHLSPlayerListeners>(event: E, listener: HMSHLSPlayerListeners[E]) {
    this._emitter.on(event, listener);
  }

  off<E extends keyof HMSHLSPlayerListeners>(event: E, listener: HMSHLSPlayerListeners[E]) {
    this._emitter.off(event, listener);
  }

  emit<E extends keyof HMSHLSPlayerListeners>(event: E, eventObject: Parameters<HMSHLSPlayerListeners[E]>[1]): boolean {
    return this._emitter.emit(event, event, eventObject);
  }

  /**
   * get current video volume
   */
  public get volume(): number {
    return this._volume;
  }
  /**
   * set video volumne
   * @param { volume } - define volume in range [1,100]
   */
  setVolume(volume: number) {
    this.validateVideoEl();
    this.videoEl.volume = volume / 100;
    this._volume = volume;
  }
  /**
   *
   * @returns returns a ILevel which represents current
   * quality level. -1 if currentlevel is set to "Auto"
   */
  getCurrentLevel(): ILevel | null {
    if (this.hls && this.hls.currentLevel !== -1) {
      const currentLevel = this.hls?.levels.at(this.hls?.currentLevel);
      return currentLevel ? mapLevel(currentLevel) : null;
    }
    return null;
  }

  /**
   *
   * @param { ILevel } currentLevel - currentLevel we want to
   * set the stream to -1 for Auto
   */
  setCurrentLevel(currentLevel: ILevel) {
    if (this.hls) {
      const current = this.hls.levels.findIndex((level: Level) => {
        return level?.attrs?.RESOLUTION === currentLevel?.resolution;
      });
      this.hls.currentLevel = current;
    }
    return;
  }
  /**
   * set current stream to Live
   */
  async seekToLivePosition() {
    this.validateVideoEl();
    let end = 0;
    if (this.videoEl?.buffered.length > 0) {
      end = this.videoEl?.buffered.end(this.videoEl?.buffered.length - 1);
    }
    this.videoEl.currentTime = this.hls?.liveSyncPosition || end;
    if (this.videoEl.paused) {
      try {
        await this.playVideo();
      } catch (err) {
        console.error('Attempt to jump to live position Failed.', err);
      }
    }
  }
  /**
   * Play stream
   */
  play = async () => {
    await this.playVideo();
  };
  /**
   * Pause stream
   */
  pause = () => {
    this.pauseVideo();
  };
  /**
   * It will update the video element current time
   * @param seekValue Pass currentTime in second
   */
  seekTo = (seekValue: number) => {
    this.validateVideoEl();
    this.videoEl.currentTime = seekValue;
  };
  unblockAutoPlay = async () => {
    try {
      await this.play();
    } catch (error) {
      console.error('Tried to unblock autoplay failed with', error);
      this.emit(HMSHLSPlayerEvents.ERROR, HMSHLSErrorFactory.HLSMediaError.autoblockFailed());
    }
  };
  private validateVideoEl() {
    if (!this.videoEl) {
      const error = HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
      this.emit(HMSHLSPlayerEvents.ERROR, error);
    }
  }
  private playVideo = async () => {
    this.validateVideoEl();
    try {
      if (this.videoEl.paused) {
        await this.videoEl.play();
      }
    } catch (error: any) {
      console.debug('Browser blocked autoplay with error', error.toString());
      console.debug('asking user to play the video manually...');
      if (error.name === 'NotAllowedError') {
        this.emit(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, true);
      }
    }
  };
  private pauseVideo = () => {
    this.validateVideoEl();
    try {
      if (!this.videoEl.paused) {
        this.videoEl.pause();
      }
    } catch (error: any) {
      console.debug('asking user to pause the video manually...');
    }
  };
  private playEventHandler = () => {
    this.emit(HMSHLSPlayerEvents.PLAYBACK_STATE, {
      state: HLSPlaybackState.playing,
    });
  };
  private pauseEventHandler = () => {
    this.emit(HMSHLSPlayerEvents.PLAYBACK_STATE, {
      state: HLSPlaybackState.paused,
    });
  };
  private volumeEventHandler = () => {
    this.validateVideoEl();
    this._volume = this.videoEl.volume;
  };
  private handleNetworkRelatedError = (data: ErrorData): boolean => {
    const details = data.error?.message || data.err?.message || '';
    const detail = {
      details: details,
      fatal: data.fatal,
    };
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.manifestLoadError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        return true;
      }
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.nanifestParsingError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        return true;
      }
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.levelLoadError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        return true;
      }
    }
    return false;
  };
  // eslint-disable-next-line complexity
  private handleHLSException = (_: any, data: ErrorData) => {
    const details = data.error?.message || data.err?.message || '';
    const isErrorFound = this.handleNetworkRelatedError(data);
    if (isErrorFound) {
      return;
    }
    const detail = {
      details: details,
      fatal: data.fatal,
    };
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.manifestIncompatibleCodecsError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.FRAG_DECRYPT_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.fragDecryptError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.bufferIncompatibleCodecsError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      default: {
        const error = HMSHLSErrorFactory.UnknownError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
    }
  };
  private manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    const level: ILevel[] = mapLevels(this.removeAudioLevels(levels));
    this.emit(HMSHLSPlayerEvents.MANIFEST_LOADED, {
      levels: level,
    });
  };
  private levelUpdatedHandler = (_: any, { level }: { level: number }) => {
    const qualityLevel: ILevel = mapLevel(this.hls.levels[level]);
    this.emit(HMSHLSPlayerEvents.LEVEL_UPDATED, {
      level: qualityLevel,
    });
  };

  private handleTimeUpdateListener = (_: Event) => {
    if (!this.videoEl) {
      return;
    }
    this.emit(HMSHLSPlayerEvents.CURRENT_TIME, this.videoEl.currentTime);
    const live = this.hls.liveSyncPosition
      ? this.hls.liveSyncPosition - this.videoEl.currentTime <= HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY
      : false;
    if (this._isLive !== live) {
      this._isLive = live;
      this.emit(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, {
        isLive: this._isLive,
      });
    }
  };
  /**
   * Listen to hlsjs and video related events
   */
  private listenHLSEvent() {
    this.validateVideoEl();
    if (Hls.isSupported()) {
      this.hls.on(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.on(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.on(Hls.Events.ERROR, this.handleHLSException);
    } else if (this.videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // code for ios safari, mseNot Supported.
      this.videoEl.src = this.hlsUrl;
    }
    this.videoEl.addEventListener('timeupdate', this.handleTimeUpdateListener);
    this.videoEl.addEventListener('play', this.playEventHandler);
    this.videoEl.addEventListener('pause', this.pauseEventHandler);
    this.videoEl.addEventListener('volumechange', this.volumeEventHandler);
  }

  private getPlayerConfig(): Partial<HlsConfig> {
    return {
      enableWorker: true,
      maxBufferLength: 20,
      backBufferLength: 10,
    };
  }

  /**
   * @param {Array} levels array from hlsJS
   * @returns a new array with only video levels.
   */
  private removeAudioLevels(levels: LevelParsed[]) {
    return levels.filter(({ videoCodec, width, height }) => !!videoCodec || !!(width && height));
  }
}
