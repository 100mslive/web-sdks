import { HlsStats } from '@100mslive/hls-stats';
import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import Hls, { ErrorData, Fragment, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSControllerEventEmitter, HMSHLSControllerListeners, IHMSHLSControllerEventEmitter } from './events';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import IHMSHLSController from '../interfaces/IHLSController';
import { ILevel } from '../interfaces/ILevel';
import {
  HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY,
  HMSHLSControllerEvents,
  HMSHLSPlaybackState,
  IS_OPTIMIZED,
} from '../utilies/constants';
import { mapLevel, mapLevels, metadataPayloadParser } from '../utilies/utils';

export class HMSHLSController implements IHMSHLSController, IHMSHLSControllerEventEmitter {
  private hls: Hls;
  private hlsUrl: string;
  private hlsStats: HlsStats;
  private videoEl: HTMLMediaElement;
  private _emitter: HMSHLSControllerEventEmitter;
  private _subscribeHlsStats?: (() => void) | null = null;
  private _isLive: boolean;
  private _volume: number;
  constructor(hlsUrl: string, videoEl: HTMLVideoElement) {
    this.hls = new Hls(this.getControllerConfig());
    this._emitter = new HMSHLSControllerEventEmitter(new EventEmitter());
    this.hlsUrl = hlsUrl;
    this.videoEl = videoEl;
    this.validateVideoEl();
    if (!hlsUrl) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound();
    }
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(videoEl);
    this._isLive = true;
    this._volume = videoEl.volume * 100;
    this.hlsStats = new HlsStats(this.hls, videoEl);
    this.listenHLSEvent();
    this.seekToLivePosition();
  }
  /**
   * @returns return custom list of events
   */
  static get Events(): typeof HMSHLSControllerEvents {
    return HMSHLSControllerEvents;
  }
  /**
   * MSE - media source extension is required to run hls.js
   * @returns return if mse is supported or not
   */
  static isMSESupported(): boolean {
    return Hls.isSupported();
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

    if (HMSHLSController.isMSESupported()) {
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
  on<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]) {
    this._emitter.on(event, listener);
  }

  once<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]) {
    this._emitter.once(event, listener);
  }

  removeAllListeners<E extends keyof HMSHLSControllerListeners>(event?: E | undefined) {
    this._emitter.removeAllListeners(event);
  }

  off<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]) {
    this._emitter.off(event, listener);
  }

  listeners<E extends keyof HMSHLSControllerListeners>(event: E): HMSHLSControllerListeners[E][] {
    return this._emitter.listeners(event);
  }

  private emit<E extends keyof HMSHLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HMSHLSControllerListeners[E]>[1],
  ): boolean {
    return this._emitter.emit(event, name, eventObject);
  }

  listenerCount<E extends keyof HMSHLSControllerListeners>(event: E): number {
    return this._emitter.listenerCount(event);
  }

  private trigger<E extends keyof HMSHLSControllerListeners>(
    event: E,
    eventObject: Parameters<HMSHLSControllerListeners[E]>[1],
  ): boolean {
    try {
      return this.emit(event, event, eventObject);
    } catch (e: any) {
      console.error(
        `An internal error happened while handling event ${event}. Error message: "${e.message}". Here is a stacktrace:`,
        e,
      );
    }
    return false;
  }
  /**
   * get if is video stream is live
   */
  isLive(): boolean {
    return this._isLive;
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
    this.videoEl.currentTime = this.hls?.liveSyncPosition || 0;
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
  private validateVideoEl() {
    if (!this.videoEl) {
      const error = HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
      this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
      throw error;
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
        this.trigger(HMSHLSControllerEvents.HLS_AUTOPLAY_BLOCKED, true);
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
    this.trigger(HMSHLSControllerEvents.HLS_PLAYBACK_STATE, {
      state: HMSHLSPlaybackState.play,
    });
  };
  private pauseEventHandler = () => {
    this.trigger(HMSHLSControllerEvents.HLS_PLAYBACK_STATE, {
      state: HMSHLSPlaybackState.pause,
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
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.nanifestParsingError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.levelLoadError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      default: {
        const error = HMSHLSErrorFactory.UnknownError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
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
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      case Hls.ErrorDetails.FRAG_DECRYPT_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.fragDecryptError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      case Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.bufferIncompatibleCodecsError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
      default: {
        const error = HMSHLSErrorFactory.UnknownError(detail);
        this.trigger(HMSHLSControllerEvents.HLS_ERROR, error);
        throw error;
      }
    }
  };
  private manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    const level: ILevel[] = mapLevels(levels);
    this.removeAudioLevels(level);
    this.trigger(HMSHLSControllerEvents.HLS_MANIFEST_LOADED, {
      levels: level,
    });
  };
  private levelUpdatedHandler = (_: any, { level }: { level: number }) => {
    const qualityLevel: ILevel = mapLevel(this.hls.levels[level]);
    this.trigger(HMSHLSControllerEvents.HLS_LEVEL_UPDATED, {
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
            this.trigger(HMSHLSControllerEvents.HLS_TIMED_METADATA_LOADED, {
              payload,
              duration,
            });
          }, timeDifference * 1000);
        }
      });
    } catch (e) {
      console.error('FRAG_CHANGED event error', e);
    }
  };
  private extractMetaTextTrack = (): TextTrack | null => {
    const textTrackListCount = this.videoEl?.textTracks.length || 0;
    for (let trackIndex = 0; trackIndex < textTrackListCount; trackIndex++) {
      const textTrack = this.videoEl?.textTracks[trackIndex];
      if (textTrack?.kind !== 'metadata') {
        continue;
      }
      textTrack.mode = 'showing';
      return textTrack;
    }
    return null;
  };
  private fireCues = (cues: TextTrackCueList) => {
    const cuesLength = cues.length;
    let cueIndex = 0;
    while (cueIndex < cuesLength) {
      const cue: TextTrackCue = cues[cueIndex];
      // @ts-ignore
      if (cue.fired) {
        cueIndex++;
        continue;
      }
      // @ts-ignore
      const data: { [key: string]: string } = metadataPayloadParser(cue.value.data);
      // @ts-ignore
      const programData = this.videoEl?.getStartDate();
      const startDate = data.start_date;
      const endDate = data.end_date;
      const startTime =
        new Date(startDate).getTime() - new Date(programData).getTime() - (this.videoEl?.currentTime || 0) * 1000;
      const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
      setTimeout(() => {
        this.trigger(HMSHLSControllerEvents.HLS_TIMED_METADATA_LOADED, {
          payload: data.payload,
          duration,
        });
      }, startTime);
      // @ts-ignore
      cue.fired = true;
      cueIndex++;
    }
  };
  private handleTimedMetaData = () => {
    if (HMSHLSController.isMSESupported() || !this.videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
      return;
    }
    // extracct timed metadata text track
    const metaTextTrack: TextTrack | null = this.extractMetaTextTrack();
    if (!metaTextTrack || !metaTextTrack.cues) {
      return;
    }
    // fire cue for timed meta data extract
    this.fireCues(metaTextTrack.cues);
  };
  private handleTimeUpdateListener = (_: Event) => {
    if (!this.videoEl) {
      return;
    }
    // handling timed metadata for non mse supported devices.
    this.handleTimedMetaData();
    this.trigger(HMSHLSControllerEvents.HLS_CURRENT_TIME, this.videoEl.currentTime);
    const allowedDelay = this.getControllerConfig().liveMaxLatencyDuration || HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY;
    this._isLive = this.hls.liveSyncPosition
      ? this.hls.liveSyncPosition - this.videoEl.currentTime <= allowedDelay
      : false;
    if (!this._isLive) {
      this.trigger(HMSHLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE, {
        isLive: this._isLive,
      });
    }
  };
  /**
   * Listen to hlsjs and video related events
   */
  private listenHLSEvent() {
    this.validateVideoEl();
    if (HMSHLSController.isMSESupported()) {
      this.hls.on(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.on(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.on(Hls.Events.ERROR, this.handleHLSException);
      this.hls.on(Hls.Events.FRAG_CHANGED, this.fragChangeHandler);
    } else if (this.videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
      // code for ios safari, mseNot Supported.
      this.videoEl.src = this.hlsUrl;
    }
    this.videoEl.addEventListener('timeupdate', this.handleTimeUpdateListener);
    this.videoEl.addEventListener('play', this.playEventHandler);
    this.videoEl.addEventListener('pause', this.pauseEventHandler);
    this.videoEl.addEventListener('volumechange', this.volumeEventHandler);
  }

  getControllerConfig(isOptimized: boolean = IS_OPTIMIZED): Partial<HlsConfig> {
    if (isOptimized) {
      // should reduce the latency by around 2-3 more seconds. Won't work well without good internet.
      // optimezed version is not working disable seeks
      return {
        enableWorker: true,
        liveSyncDuration: 1,
        liveMaxLatencyDuration: 5,
        highBufferWatchdogPeriod: 1,
        maxBufferLength: 20,
        backBufferLength: 10,
      };
    }
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
