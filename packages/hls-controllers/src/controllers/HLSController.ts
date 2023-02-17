import { HlsStats } from '@100mslive/hls-stats';
import { EventEmitter } from 'eventemitter3';
import Hls, { ErrorData, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSControllerEventEmitter, HMSHLSControllerListeners } from './events';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import IHMSHLSController from '../interfaces/IHLSController';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HMSHLSControllerEvents, IS_OPTIMIZED } from '../utilies/constants';
import { metadataPayloadParser } from '../utilies/utils';
export type { LevelParsed };

export class HMSHLSController implements IHMSHLSController, HMSHLSControllerEventEmitter {
  private hls: Hls;
  private hlsUrl: string;
  private hlsStats: HlsStats;
  private videoRef: React.RefObject<HTMLVideoElement>;
  private _emitter: HMSHLSControllerEventEmitter;
  private _subscribeHlsStats?: (() => void) | null = null;
  private isLive: boolean;
  constructor(hlsUrl: string, videoRef: React.RefObject<HTMLVideoElement>) {
    this.hls = new Hls(this.getControllerConfig());
    this._emitter = new EventEmitter();
    this.hlsUrl = hlsUrl;
    this.videoRef = videoRef;
    if (!videoRef || !videoRef.current) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    if (!hlsUrl) {
      throw new Error('hls url is not valid');
    }
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(videoRef.current);
    this.isLive = true;
    this.hlsStats = new HlsStats(this.hls, videoRef.current);
    this.listenHLSEvent();
    this.onHLSTimeMetadataParsing();
    this.jumpToLive();
  }

  static get Events(): typeof HMSHLSControllerEvents {
    return HMSHLSControllerEvents;
  }
  // HLSStats subscribe
  subscribe = (callback: (state: any) => void, interval = 2000) => {
    this._subscribeHlsStats = this.hlsStats.subscribe((state: any) => {
      callback(state);
    }, interval);
    return this.unsubscribe;
  };
  /**
   * MSE - media source extension is required to run hls.js
   * @returns return if mse is supported or not
   */
  static isMSESupported(): boolean {
    return Hls.isSupported();
  }
  unsubscribe = () => {
    if (this._subscribeHlsStats) {
      this._subscribeHlsStats();
    }
  };
  // reset the controller
  reset() {
    if (this.hls && this.hls.media) {
      this.hls.detachMedia();
      this.unsubscribe();
    }

    if (HMSHLSController.isMSESupported()) {
      this.hls.off(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.off(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.off(Hls.Events.ERROR, this.handleHLSException);
    }
    if (this.videoRef && this.videoRef.current) {
      this.videoRef.current.removeEventListener('play', this.playEventHandler);
      this.videoRef.current.removeEventListener('pause', this.pauseEventHandler);
      this.videoRef.current.removeEventListener('timeupdate', this.handleTimeUpdateListener);
    }
  }
  getIsLive(): boolean {
    return this.isLive;
  }
  /**
   *
   * @returns returns a Number which represents current
   * quality level. -1 if currentlevel is set to "Auto"
   */
  getCurrentLevel(): number {
    if (this.hls) {
      return this.hls?.currentLevel;
    }
    return -1;
  }

  /**
   *
   * @param { Level } currentLevel - currentLevel we want to
   * set the stream to. -1 for Auto
   */
  setCurrentLevel(currentLevel: Level) {
    if (this.hls) {
      let current = -1;
      this.hls.levels.filter((level: Level, index: number) => {
        if (level.attrs?.RESOLUTION === currentLevel.attrs?.RESOLUTION) {
          current = index;
        }
      });
      this.hls.currentLevel = current;
    }
    return;
  }

  jumpToLive() {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    videoEl.currentTime = this.hls?.liveSyncPosition || 0;
    if (videoEl.paused) {
      try {
        videoEl.play();
      } catch (err) {
        console.error('Attempt to jump to live position Failed.', err);
      }
    }
  }

  on<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    context: Context = this as any,
  ) {
    this._emitter.on(event, listener, context);
  }

  once<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    context: Context = this as any,
  ) {
    this._emitter.once(event, listener, context);
  }

  removeAllListeners<E extends keyof HMSHLSControllerListeners>(event?: E | undefined) {
    this._emitter.removeAllListeners(event);
  }

  off<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener?: HMSHLSControllerListeners[E] | undefined,
    context: Context = this as any,
    once?: boolean | undefined,
  ) {
    this._emitter.off(event, listener, context, once);
  }

  listeners<E extends keyof HMSHLSControllerListeners>(event: E): HMSHLSControllerListeners[E][] {
    return this._emitter.listeners(event);
  }

  emit<E extends keyof HMSHLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HMSHLSControllerListeners[E]>[1],
  ): boolean {
    return this._emitter.emit(event, name, eventObject);
  }

  listenerCount<E extends keyof HMSHLSControllerListeners>(event: E): number {
    return this._emitter.listenerCount(event);
  }

  trigger<E extends keyof HMSHLSControllerListeners>(
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

  private handleNetworkRelatedError = (data: ErrorData) => {
    const details = data.error?.message || data.err?.message || '';
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR: {
        throw HMSHLSErrorFactory.HLSNetworkError.manifestLoadError({
          details: details,
          fatal: data.fatal,
        });
      }
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR: {
        throw HMSHLSErrorFactory.HLSNetworkError.nanifestParsingError({
          details: details,
          fatal: data.fatal,
        });
      }
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR: {
        throw HMSHLSErrorFactory.HLSNetworkError.levelLoadError({
          details: details,
          fatal: data.fatal,
        });
      }
      default: {
        throw HMSHLSErrorFactory.UnknownError({
          details: details,
          fatal: data.fatal,
        });
      }
    }
  };
  private handleHLSException = (_: any, data: ErrorData) => {
    const details = data.error?.message || data.err?.message || '';
    this.handleNetworkRelatedError(data);
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR: {
        throw HMSHLSErrorFactory.HLSMediaError.manifestIncompatibleCodecsError({
          details: details,
          fatal: data.fatal,
        });
      }
      case Hls.ErrorDetails.FRAG_DECRYPT_ERROR: {
        throw HMSHLSErrorFactory.HLSMediaError.fragDecryptError({
          details: details,
          fatal: data.fatal,
        });
      }
      case Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR: {
        throw HMSHLSErrorFactory.HLSMediaError.bufferIncompatibleCodecsError({
          details: details,
          fatal: data.fatal,
        });
      }
      default: {
        throw HMSHLSErrorFactory.UnknownError({
          details: details,
          fatal: data.fatal,
        });
      }
    }
  };
  private manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    this.removeAudioLevels(levels);
    this.trigger(HMSHLSControllerEvents.HLS_MANIFEST_LOADED, {
      levels,
    });
  };
  private levelUpdatedHandler = (_: any, { level }: { level: number }) => {
    const qualityLevel: Level = this.hls.levels[level];
    this.trigger(HMSHLSControllerEvents.HLS_LEVEL_UPDATED, {
      level: {
        attrs: qualityLevel.attrs,
        audioCodec: qualityLevel.audioCodec,
        bitrate: qualityLevel.bitrate,
        details: qualityLevel.details,
        height: qualityLevel.height,
        id: qualityLevel.id,
        unknownCodecs: qualityLevel.unknownCodecs,
        url: qualityLevel.url[0],
        videoCodec: qualityLevel.videoCodec,
        width: qualityLevel.width,
        name: qualityLevel.name || '',
      },
    });
  };
  /**
   * It will update the video element current time
   * @param interval Pass currentTime in second
   */
  seek = (interval: number) => {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    videoEl.currentTime = interval;
  };
  playVideo = async () => {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    try {
      if (videoEl.paused) {
        await videoEl.play();
      }
    } catch (error: any) {
      console.debug('Browser blocked autoplay with error', error.toString());
      console.debug('asking user to play the video manually...');
      if (error.name === 'NotAllowedError') {
        this.trigger(HMSHLSControllerEvents.HLS_AUTOPLAY_BLOCKED, true);
      }
    }
  };
  private playEventHandler = async () => {
    await this.playVideo();
    this.trigger(HMSHLSControllerEvents.HLS_PLAY, true);
  };
  private pauseEventHandler = () => {
    this.trigger(HMSHLSControllerEvents.HLS_PAUSE, true);
  };
  private extractMetaTextTrack = (videoEl: HTMLVideoElement | null): TextTrack | null => {
    const textTrackListCount = videoEl?.textTracks.length || 0;
    for (let trackIndex = 0; trackIndex < textTrackListCount; trackIndex++) {
      const textTrack = videoEl?.textTracks[trackIndex];
      if (textTrack?.kind !== 'metadata') {
        continue;
      }
      textTrack.mode = 'showing';
      return textTrack;
    }
    return null;
  };
  private fireCues = (videoEl: HTMLVideoElement | null, cues: TextTrackCueList) => {
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
      const programData = videoEl?.getStartDate();
      const startDate = data.start_date;
      const endDate = data.end_date;
      const startTime =
        new Date(startDate).getTime() - new Date(programData).getTime() - (videoEl?.currentTime || 0) * 1000;
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
  private handleTimedMetaData = (videoEl: HTMLVideoElement) => {
    if (HMSHLSController.isMSESupported() || !videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
      return;
    }
    // extracct timed metadata text track
    const metaTextTrack: TextTrack | null = this.extractMetaTextTrack(videoEl);
    if (!metaTextTrack || !metaTextTrack.cues) {
      return;
    }
    // fire cue for timed meta data extract
    this.fireCues(videoEl, metaTextTrack.cues);
  };
  private handleTimeUpdateListener = (_: Event) => {
    const videoEl: HTMLVideoElement | null = this.videoRef.current;
    if (!videoEl) {
      return;
    }
    // handling timed metadata for non mse supported devices.
    this.handleTimedMetaData(videoEl);
    this.trigger(HMSHLSControllerEvents.HLS_CURRENT_TIME, videoEl.currentTime);
    const allowedDelay = this.getControllerConfig().liveMaxLatencyDuration || HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY;
    this.isLive = this.hls.liveSyncPosition ? this.hls.liveSyncPosition - videoEl.currentTime <= allowedDelay : false;
    if (!this.isLive) {
      this.trigger(HMSHLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE, {
        isLive: this.isLive,
      });
    }
  };
  private listenHLSEvent() {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    if (HMSHLSController.isMSESupported()) {
      this.hls.on(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.on(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
      this.hls.on(Hls.Events.ERROR, this.handleHLSException);
    } else if (videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
      // code for ios safari, mseNot Supported.
      videoEl.src = this.hlsUrl;
    }
    videoEl.addEventListener('timeupdate', this.handleTimeUpdateListener);
    videoEl.addEventListener('play', this.playEventHandler);
    videoEl.addEventListener('pause', this.pauseEventHandler);
  }
  /**
   * Metadata are automatically parsed and added to the video element's
   * textTrack cue by hlsjs as they come through the stream.
   * in FRAG_CHANGED, we read the cues and emit HLS_METADATA_LOADED
   * when the current fragment has a metadata to play.
   */
  private onHLSTimeMetadataParsing() {
    const videoEle = this.videoRef.current;
    if (!videoEle) {
      throw HMSHLSErrorFactory.HLSMediaError.videoElementNotFound();
    }
    this.hls.on(Hls.Events.FRAG_CHANGED, (_, { frag }) => {
      try {
        if (videoEle.textTracks.length === 0) {
          return;
        }

        const fragStartTime = frag.start;
        /**
         * this destructuring is needed because the cues array not a pure
         * JS array and prevents us from
         * performing array operations like map(),filter() etc.
         */
        // @ts-ignore
        const metadata = [...videoEle.textTracks[0].cues];
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
    });
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
  private removeAudioLevels(levels: LevelParsed[]) {
    return levels.filter(({ videoCodec, width, height }) => !!videoCodec || !!(width && height));
  }
}
