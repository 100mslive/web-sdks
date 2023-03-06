import { HlsStats } from '@100mslive/hls-stats';
import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import Hls, { ErrorData, Fragment, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSPlayerEventEmitter, HMSHLSPlayerListeners, IHMSHLSPlayerEventEmitter } from './events';
import { HMSHLSMetadata } from './HMSHLSMetadata';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import IHMSHLSPlayer from '../interfaces/IHMSHLSPlayer';
import { ILevel } from '../interfaces/ILevel';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';
import { mapLevel, mapLevels, metadataPayloadParser } from '../utilies/utils';

export class HMSHLSPlayer implements IHMSHLSPlayer, IHMSHLSPlayerEventEmitter {
  private hls: Hls;
  private hlsUrl: string;
  private hlsStats: HlsStats;
  private videoEl: HTMLVideoElement;
  private _emitter: HMSHLSPlayerEventEmitter;
  private _subscribeHlsStats?: (() => void) | null = null;
  private _isLive: boolean;
  private _volume: number;
  private _metaData: HMSHLSMetadata;
  /**
   * Initiliaze the player with hlsUrl and video element
   * @remarks If video element is not passed, we will create one and call a method getVideoElement get element
   * @param hlsUrl required - Pass hls url to
   * @param videoEl optional field - HTML video element
   */
  constructor(hlsUrl: string, videoEl?: HTMLVideoElement) {
    this.hls = new Hls(this.getPlayerConfig());
    this._emitter = new HMSHLSPlayerEventEmitter(new EventEmitter());
    this.hlsUrl = hlsUrl;
    this.videoEl = videoEl || this.createVideoElement();
    if (!hlsUrl) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound();
    }
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(this.videoEl);
    this._metaData = new HMSHLSMetadata(this, this.videoEl);
    this._isLive = true;
    this._metaData.startMetadataListner();
    this._volume = this.videoEl.volume * 100;
    this.hlsStats = new HlsStats(this.hls, this.videoEl);
    this.listenHLSEvent();
    this.seekToLivePosition();
  }
  /**
   * @remarks It will create a video element with playiniline true.
   * @returns HTML video element
   */
  private createVideoElement(): HTMLVideoElement {
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
  subscribeStats = (callback: (state: any) => void, interval = 2000) => {
    this._subscribeHlsStats = this.hlsStats.subscribe((state: any) => {
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
      this._metaData.endMetaListner();
    }
    if (Hls.isSupported()) {
      this.hls.off(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.off(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.off(Hls.Events.ERROR, this.handleHLSException);
      this.hls.off(Hls.Events.FRAG_CHANGED, this.fragChangeHandler);
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
        return level?.attrs?.RESOLUTION === currentLevel?.attrs?.RESOLUTION;
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
      throw new Error('failed to autoplay');
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
      state: HLSPlaybackState.play,
    });
  };
  private pauseEventHandler = () => {
    this.emit(HMSHLSPlayerEvents.PLAYBACK_STATE, {
      state: HLSPlaybackState.pause,
    });
  };
  private volumeEventHandler = () => {
    this.validateVideoEl();
    this._volume = this.videoEl.volume;
  };
  private handleNetworkRelatedError = (data: ErrorData) => {
    const details = data.error?.message || data.err?.message || '';
    const detail = {
      details: details,
      fatal: data.fatal,
    };
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.manifestLoadError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.nanifestParsingError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.levelLoadError(detail);
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
  private handleHLSException = (_: any, data: ErrorData) => {
    const details = data.error?.message || data.err?.message || '';
    this.handleNetworkRelatedError(data);
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
        console.log('unknow data ', data);
        const error = HMSHLSErrorFactory.UnknownError(detail);
        this.emit(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
    }
  };
  private manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    const level: ILevel[] = mapLevels(levels);
    this.removeAudioLevels(level);
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

  /**
   * Metadata are automatically parsed and added to the video element's
   * textTrack cue by hlsjs as they come through the stream.
   * in FRAG_CHANGED, we read the cues and emit HLS_METADATA_LOADED
   * when the current fragment has a metadata to play.
   */
  private fragChangeHandler = (_: any, { frag }: { frag: Fragment }) => {
    this.validateVideoEl();
    try {
      if (this.videoEl.textTracks.length === 0) {
        return;
      }
      const fragStartTime = frag.start;
      /**
       * this destructuring is needed because the cues array not a pure
       * JS array and prevents us from
       * performing array operations like map(),filter() etc.
       */
      // @ts-ignore
      const metadata = [...this.videoEl.textTracks[0].cues];
      /**
       * filter out only the metadata that have startTime set to future.
       * (i.e) more than the current fragment's startime.
       */
      const metadataAfterFragStart = metadata.filter(mt => {
        return mt.startTime >= fragStartTime;
      });

      metadataAfterFragStart.forEach(mt => {
        const timeDifference = mt.startTime - fragStartTime;
        const fragmentDuration = frag.end - frag.start;

        if (timeDifference < fragmentDuration) {
          const data = mt.value.data;
          const payload = metadataPayloadParser(data).payload;
          /**
           * we start a timeout for difference seconds.
           * NOTE: Due to how setTimeout works, the time is only the minimum gauranteed
           * time JS will wait before calling emit(). It's not guaranteed even
           * for timeDifference = 0.
           */
          setTimeout(() => {
            /** Even though duration comes as an attribute in the stream,
             * HlsJs doesn't give us a property duration directly. So
             * we calculate it ouselves. This is same as reading
             * EXT-INF tag.
             */
            const duration = mt.endTime - mt.startTime;

            /**
             * finally emit event letting the user know its time to
             * do whatever they want with the payload
             */
            this.emit(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, {
              id: mt.id,
              payload: payload,
              duration: duration,
              startDate: new Date(mt.startTime),
              endDate: new Date(mt.endTime),
            });
          }, timeDifference * 1000);
        }
      });
    } catch (e) {
      console.error('FRAG_CHANGED event error', e);
    }
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
      this.hls.on(Hls.Events.FRAG_CHANGED, this.fragChangeHandler);
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
   *
   * This function is needed because HLSJS currently doesn't
   * support switching to audio rendition from a video rendition.
   * more on this here
   * https://github.com/video-dev/hls.js/issues/4881
   * https://github.com/video-dev/hls.js/issues/3480#issuecomment-778799541
   * https://github.com/video-dev/hls.js/issues/163#issuecomment-169773788
   *
   * @param {Array} levels array from hlsJS
   * @returns a new array with only video levels.
   */
  private removeAudioLevels(levels: ILevel[]) {
    return levels.filter(({ videoCodec, width, height }) => !!videoCodec || !!(width && height));
  }
}
/**
 * Use mostly video element
 * remove mse supported
 * video element canPlay is supported, throw error
 * separate timedMetadata class and listen on timeupdate events
 */
