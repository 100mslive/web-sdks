import { HlsStats } from '@100mslive/hls-stats';
import { EventEmitter } from 'eventemitter3';
import Hls, { HlsConfig, Level, LevelParsed } from 'hls.js';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HLSControllerEvents, IS_OPTIMIZED } from './constants';
import { HlsControllerEventEmitter, HLSControllerListeners } from './events';
import IHLSController from '../interfaces/IHLSController';

export type { LevelParsed };

export class HLSController implements IHLSController, HlsControllerEventEmitter {
  private hls: Hls;
  private hlsStats: HlsStats;
  private videoRef: React.RefObject<HTMLVideoElement>;
  private _emitter: HlsControllerEventEmitter;
  private _subscribeHlsStats?: (() => void) | null = null;
  private isLive: boolean;
  constructor(hlsUrl: string, videoRef: React.RefObject<HTMLVideoElement>) {
    this.hls = new Hls(this.getControllerConfig());
    this._emitter = new EventEmitter();
    this.videoRef = videoRef;
    if (!videoRef || !videoRef.current) {
      throw new Error('video ref cannot be null');
    }
    if (!hlsUrl) {
      throw new Error('hls url is not valid');
    }
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(videoRef.current);
    this.isLive = true;
    this.hlsStats = new HlsStats(this.hls, videoRef.current);
    this.handleHLSTimeMetadataParsing();
    this.enableTimeUpdateListener();
    this.listenHLSEvent();
  }

  static get Events(): typeof HLSControllerEvents {
    return HLSControllerEvents;
  }
  // HLSStats subscribe
  subscribe = (callback: (state: any) => void, interval = 2000) => {
    this._subscribeHlsStats = this.hlsStats.subscribe((state: any) => {
      console.log('controller ', state);
      callback(state);
    }, interval);
    return this.unsubscribe;
  };
  static isMSENotSupported(): boolean {
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

    if (HLSController.isMSENotSupported()) {
      this.hls.off(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.off(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
    }
    if (this.videoRef && this.videoRef.current) {
      this.videoRef.current.removeEventListener('play', this.playEventHandler);
      this.videoRef.current.removeEventListener('pause', this.pauseEventHandler);
      this.videoRef.current.addEventListener('timeupdate', this.handleTimeupdate);
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

  getControllerInstance(): HLSController {
    return this;
  }

  jumpToLive() {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw new Error('Video element is not defined');
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

  on<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener: HLSControllerListeners[E],
    context: Context = this as any,
  ) {
    this._emitter.on(event, listener, context);
  }

  once<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener: HLSControllerListeners[E],
    context: Context = this as any,
  ) {
    this._emitter.once(event, listener, context);
  }

  removeAllListeners<E extends keyof HLSControllerListeners>(event?: E | undefined) {
    this._emitter.removeAllListeners(event);
  }

  off<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener?: HLSControllerListeners[E] | undefined,
    context: Context = this as any,
    once?: boolean | undefined,
  ) {
    this._emitter.off(event, listener, context, once);
  }

  listeners<E extends keyof HLSControllerListeners>(event: E): HLSControllerListeners[E][] {
    return this._emitter.listeners(event);
  }

  emit<E extends keyof HLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HLSControllerListeners[E]>[1],
  ): boolean {
    return this._emitter.emit(event, name, eventObject);
  }

  listenerCount<E extends keyof HLSControllerListeners>(event: E): number {
    return this._emitter.listenerCount(event);
  }

  trigger<E extends keyof HLSControllerListeners>(
    event: E,
    eventObject: Parameters<HLSControllerListeners[E]>[1],
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
  manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    this.removeAudioLevels(levels);
    this.trigger(HLSControllerEvents.HLS_MANIFEST_LOADED, {
      levels,
    });
  };
  levelUpdatedHandler = (_: any, { level }: { level: number }) => {
    const qualityLevel: Level = this.hls.levels[level];
    this.trigger(HLSControllerEvents.HLS_LEVEL_UPDATED, {
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
  playVideo = async () => {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw new Error('Video element is not defined');
    }
    try {
      if (videoEl.paused) {
        await videoEl.play();
      }
    } catch (error: any) {
      console.debug('Browser blocked autoplay with error', error.toString());
      console.debug('asking user to play the video manually...');
      if (error.name === 'NotAllowedError') {
        this.trigger(HLSControllerEvents.HLS_AUTOPLAY_BLOCKED, true);
      }
    }
  };
  playEventHandler = async () => {
    await this.playVideo();
    this.trigger(HLSControllerEvents.HLS_PLAY, true);
  };
  pauseEventHandler = () => {
    this.trigger(HLSControllerEvents.HLS_PAUSE, true);
  };
  listenHLSEvent() {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw new Error('Video element is not defined');
    }
    if (HLSController.isMSENotSupported()) {
      this.hls.on(Hls.Events.MANIFEST_LOADED, this.manifestLoadedHandler);
      this.hls.on(Hls.Events.LEVEL_UPDATED, this.levelUpdatedHandler);
    } else if (videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
      // code for ios safari, mseNot Supported.
    }

    videoEl.addEventListener('play', this.playEventHandler);
    videoEl.addEventListener('pause', this.pauseEventHandler);
  }
  handleTimeupdate = () => {
    const videoEl = this.videoRef.current;
    if (this.hls && videoEl) {
      this.trigger(HLSControllerEvents.HLS_CURRENT_TIME, videoEl.currentTime);
      const allowedDelay = this.getControllerConfig().liveMaxLatencyDuration || HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY;
      this.isLive = this.hls.liveSyncPosition
        ? this.hls.liveSyncPosition - videoEl?.currentTime <= allowedDelay
        : false;
      if (!this.isLive) {
        this.trigger(HLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE, {
          isLive: this.isLive,
        });
      }
    }
  };
  // listen for pause, play as well to show not live if paused
  enableTimeUpdateListener() {
    const videoEl = this.videoRef.current;
    if (!videoEl) {
      throw new Error('Video element is not defined');
    }
    videoEl.addEventListener('timeupdate', this.handleTimeupdate);
  }
  handleHLSTimeMetadataParsing() {
    /**
     * Metadata are automatically parsed and added to the video element's
     * textTrack cue by hlsjs as they come through the stream.
     * in FRAG_CHANGED, we read the cues and emit HLS_METADATA_LOADED
     * when the current fragment has a metadata to play.
     */
    const videoEle = this.videoRef.current;
    if (!videoEle) {
      throw new Error('Video element is not defined');
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
            const payload = mt.value.data;
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
              this.trigger(HLSControllerEvents.HLS_TIMED_METADATA_LOADED, {
                payload,
                duration,
                metadata: mt,
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
      return {
        enableWorker: true,
        liveSyncDuration: 1,
        liveMaxLatencyDuration: 5,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 1,
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

// Controller(hlsUrl, videoRef)
// will expose
// 1. Play/Pause
// 2. Duration -> getCurrentTime
// 3. Volume.
// 4. HLSStats -> subscribe, and unsuscribe.
// 5. autoPlay handling.
// 6. Go Live
// 7. Event -> HLS_STREAM_NO_LONGER_LIVE, HLS_TIMED_METADATA_LOADED, LEVEL_UPDATED
