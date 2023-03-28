import { HlsPlayerStats, HlsStats } from '@100mslive/hls-stats';
import Hls, { ErrorData, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSTimedMetadata } from './HMSHLSTimedMetadata';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import { HMSHLSPlayerEventEmitter, HMSHLSPlayerListeners, IHMSHLSPlayerEventEmitter } from '../interfaces/events';
import IHMSHLSPlayer from '../interfaces/IHMSHLSPlayer';
import { ILevel } from '../interfaces/ILevel';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';
import { mapLevel, mapLevels } from '../utilies/utils';

export class HMSHLSPlayer implements IHMSHLSPlayer, IHMSHLSPlayerEventEmitter {
  private _hls: Hls;
  private _hlsUrl: string;
  private _hlsStats: HlsStats;
  private _videoEl: HTMLVideoElement;
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
    this._hls = new Hls(this.getPlayerConfig());
    this._emitter = new HMSHLSPlayerEventEmitter();
    this._hlsUrl = hlsUrl;
    this._videoEl = videoEl || this.createVideoElement();
    if (!hlsUrl) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound();
    } else if (!hlsUrl.endsWith('m3u8')) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound('Invalid URL, pass m3u8 url');
    }
    this._hls.loadSource(hlsUrl);
    this._hls.attachMedia(this._videoEl);
    this._isLive = true;
    this._volume = this._videoEl.volume * 100;
    this._hlsStats = new HlsStats(this._hls, this._videoEl);
    this.listenHLSEvent();
    this._metaData = new HMSHLSTimedMetadata(this._hls, this._videoEl, this.emit);
    this.seekToLivePosition();
  }
  /**
   * @remarks It will create a video element with playiniline true.
   * @returns HTML video element
   */
  private createVideoElement(): HTMLVideoElement {
    if (this._videoEl) {
      return this._videoEl;
    }
    const video: HTMLVideoElement = document.createElement('video');
    video.playsInline = true;
    video.controls = false;
    video.autoplay = true;
    return video;
  }
  /**
   * @returns get html video element
   */
  getVideoElement(): HTMLVideoElement {
    return this._videoEl;
  }
  /**
   *  Subscribe to hls stats
   */
  private subscribeStats = (interval = 2000) => {
    this._subscribeHlsStats = this._hlsStats.subscribe((state: HlsPlayerStats) => {
      this.emit(HMSHLSPlayerEvents.STATS, state);
    }, interval);
  };
  /**
   * Unsubscribe to hls stats
   */
  private unsubscribeStats = () => {
    if (this._subscribeHlsStats) {
      this._subscribeHlsStats();
    }
  };
  // reset the controller
  reset() {
    if (this._hls && this._hls.media) {
      this._hls.detachMedia();
      this.unsubscribeStats();
    }
    if (this._metaData) {
      this._metaData.unregisterListener();
    }
    if (Hls.isSupported()) {
      this._hls.off(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this._hls.off(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this._hls.off(Hls.Events.ERROR, this.handleHLSException);
    }
    if (this._videoEl) {
      this._videoEl.removeEventListener('play', this.playEventHandler);
      this._videoEl.removeEventListener('pause', this.pauseEventHandler);
      this._videoEl.removeEventListener('timeupdate', this.handleTimeUpdateListener);
      this._videoEl.removeEventListener('volumechange', this.volumeEventHandler);
    }
    this.removeAllListeners();
  }

  on<E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>) {
    this._emitter.on(eventName, listener);
  }

  off<E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>) {
    this._emitter.off(eventName, listener);
  }

  emit<E extends HMSHLSPlayerEvents>(eventName: E, eventObject: Parameters<HMSHLSPlayerListeners<E>>[0]): boolean {
    return this._emitter.emit(eventName, eventObject);
  }

  private removeAllListeners<E extends HMSHLSPlayerEvents>(eventName?: E): void {
    this._emitter.removeAllListeners(eventName);
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
    this._videoEl.volume = volume / 100;
    this._volume = volume;
  }
  /**
   *
   * @returns returns a ILevel which represents current
   * quality level. -1 if currentlevel is set to "Auto"
   */
  getCurrentLevel(): ILevel | null {
    if (this._hls && this._hls.currentLevel !== -1) {
      const currentLevel = this._hls?.levels.at(this._hls?.currentLevel);
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
    if (this._hls) {
      const current = this._hls.levels.findIndex((level: Level) => {
        return level?.attrs?.RESOLUTION === currentLevel?.resolution;
      });
      this._hls.currentLevel = current;
    }
    return;
  }
  /**
   * set current stream to Live
   */
  async seekToLivePosition() {
    let end = 0;
    if (this._videoEl?.buffered.length > 0) {
      end = this._videoEl?.buffered.end(this._videoEl?.buffered.length - 1);
    }
    this._videoEl.currentTime = this._hls?.liveSyncPosition || end;
    if (this._videoEl.paused) {
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
    this._videoEl.currentTime = seekValue;
  };

  private playVideo = async () => {
    try {
      if (this._videoEl.paused) {
        await this._videoEl.play();
      }
    } catch (error) {
      console.debug('Browser blocked autoplay with error', (error as Error).message);
      console.debug('asking user to play the video manually...');
      if ((error as Error).name === 'NotAllowedError') {
        this.emit(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, HMSHLSErrorFactory.HLSMediaError.autoplayFailed());
      }
    }
  };
  private pauseVideo = () => {
    if (!this._videoEl.paused) {
      this._videoEl.pause();
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
    this._volume = this._videoEl.volume;
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
        const error = HMSHLSErrorFactory.HLSNetworkError.manifestParsingError(detail);
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
    const qualityLevel: ILevel = mapLevel(this._hls.levels[level]);
    this.emit(HMSHLSPlayerEvents.LEVEL_UPDATED, {
      level: qualityLevel,
    });
  };

  private handleTimeUpdateListener = (_: Event) => {
    if (!this._videoEl) {
      return;
    }
    this.emit(HMSHLSPlayerEvents.CURRENT_TIME, this._videoEl.currentTime);
    const live = this._hls.liveSyncPosition
      ? this._hls.liveSyncPosition - this._videoEl.currentTime <= HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY
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
    if (Hls.isSupported()) {
      this._hls.on(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this._hls.on(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this._hls.on(Hls.Events.ERROR, this.handleHLSException);
      this.subscribeStats();
    } else if (this._videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // code for ios safari, mseNot Supported.
      this._videoEl.src = this._hlsUrl;
    }
    this._videoEl.addEventListener('timeupdate', this.handleTimeUpdateListener);
    this._videoEl.addEventListener('play', this.playEventHandler);
    this._videoEl.addEventListener('pause', this.pauseEventHandler);
    this._videoEl.addEventListener('volumechange', this.volumeEventHandler);
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
