import { HlsPlayerStats, HlsStats } from '@100mslive/hls-stats';
import Hls, { ErrorData, HlsConfig, Level, LevelParsed } from 'hls.js';
import { HMSHLSTimedMetadata } from './HMSHLSTimedMetadata';
import { HMSHLSErrorFactory } from '../error/HMSHLSErrorFactory';
import { HMSHLSException } from '../error/HMSHLSException';
import { HMSHLSPlayerEventEmitter, HMSHLSPlayerListeners, IHMSHLSPlayerEventEmitter } from '../interfaces/events';
import { HMSHLSLayer } from '../interfaces/IHMSHLSLayer';
import IHMSHLSPlayer from '../interfaces/IHMSHLSPlayer';
import { HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY, HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';
import { mapLayer, mapLayers } from '../utilies/utils';

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
  private readonly TAG = '[HMSHLSPlayer]';
  /**
   * Initiliaze the player with hlsUrl and video element
   * @remarks If video element is not passed, we will create one and call a method getVideoElement get element
   * @param hlsUrl required - Pass hls url to
   * @param videoEl optional field - HTML video element
   */
  constructor(hlsUrl: string, videoEl?: HTMLVideoElement) {
    this._hls = new Hls(this.getPlayerConfig(hlsUrl));
    this._emitter = new HMSHLSPlayerEventEmitter();
    this._hlsUrl = hlsUrl;
    this._videoEl = videoEl || this.createVideoElement();
    try {
      const url = new URL(hlsUrl);
      if (!url.pathname.endsWith('m3u8')) {
        throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound('Invalid URL, pass m3u8 url');
      }
    } catch (e) {
      throw HMSHLSErrorFactory.HLSMediaError.hlsURLNotFound();
    }
    this._hls.loadSource(hlsUrl);
    this._hls.attachMedia(this._videoEl);
    this._isLive = true;
    this._volume = this._videoEl.volume * 100;
    this._hlsStats = new HlsStats(this._hls, this._videoEl);
    this.listenHLSEvent();
    this._metaData = new HMSHLSTimedMetadata(this._hls, this._videoEl, this.emitEvent);
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
      this.emitEvent(HMSHLSPlayerEvents.STATS, state);
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

  on = <E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>) => {
    this._emitter.on(eventName, listener);
  };

  off = <E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>) => {
    this._emitter.off(eventName, listener);
  };

  emitEvent = <E extends HMSHLSPlayerEvents>(
    eventName: E,
    eventObject: Parameters<HMSHLSPlayerListeners<E>>[0],
  ): boolean => {
    if (eventName === HMSHLSPlayerEvents.ERROR) {
      const hlsError = eventObject as HMSHLSException;
      if (hlsError?.isTerminal) {
        // send analytics event
        window?.__hms?.sdk?.sendHLSAnalytics(hlsError);
      }
    }
    return this._emitter.emitEvent(eventName, eventObject);
  };

  private removeAllListeners = <E extends HMSHLSPlayerEvents>(eventName?: E): void => {
    this._emitter.removeAllListeners(eventName);
  };

  public get volume(): number {
    return this._volume;
  }

  setVolume(volume: number) {
    this._videoEl.volume = volume / 100;
    this._volume = volume;
  }

  getLayer(): HMSHLSLayer | null {
    if (this._hls && this._hls.currentLevel !== -1) {
      const currentLevel = this._hls?.levels.at(this._hls?.currentLevel);
      return currentLevel ? mapLayer(currentLevel) : null;
    }
    return null;
  }

  setLayer(layer: HMSHLSLayer): void {
    if (this._hls) {
      const current = this._hls.levels.findIndex((level: Level) => {
        return level?.attrs?.RESOLUTION === layer?.resolution;
      });
      this._hls.nextLevel = current;
    }
    return;
  }
  /**
   * set current stream to Live
   */
  async seekToLivePosition() {
    let end = 0;
    if (this._videoEl.buffered.length > 0) {
      end = this._videoEl.buffered.end(this._videoEl.buffered.length - 1);
    }
    this._videoEl.currentTime = this._hls.liveSyncPosition || end;
    if (this._videoEl.paused) {
      try {
        await this.playVideo();
      } catch (err) {
        console.error(this.TAG, 'Attempt to jump to live position Failed.', err);
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

  hasCaptions = () => {
    return this._hls.subtitleTracks.length > 0;
  };

  toggleCaption = () => {
    // no subtitles, do nothing
    if (!this.hasCaptions()) {
      return;
    }
    this._hls.subtitleDisplay = !this._hls.subtitleDisplay;
    this.emitEvent(HMSHLSPlayerEvents.CAPTION_ENABLED, this._hls.subtitleDisplay);
  };

  private playVideo = async () => {
    try {
      if (this._videoEl.paused) {
        await this._videoEl.play();
      }
    } catch (error) {
      console.debug(this.TAG, 'Play failed with error', (error as Error).message);
      if ((error as Error).name === 'NotAllowedError') {
        this.emitEvent(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, HMSHLSErrorFactory.HLSMediaError.autoplayFailed());
      }
    }
  };
  private pauseVideo = () => {
    if (!this._videoEl.paused) {
      this._videoEl.pause();
    }
  };
  private playEventHandler = () => {
    this.emitEvent(HMSHLSPlayerEvents.PLAYBACK_STATE, {
      state: HLSPlaybackState.playing,
    });
  };
  private pauseEventHandler = () => {
    this.emitEvent(HMSHLSPlayerEvents.PLAYBACK_STATE, {
      state: HLSPlaybackState.paused,
    });
  };
  private volumeEventHandler = () => {
    this._volume = Math.round(this._videoEl.volume * 100);
  };

  private reConnectToStream = () => {
    window.addEventListener(
      'online',
      () => {
        this._hls.startLoad();
      },
      {
        once: true,
      },
    );
  };
  // eslint-disable-next-line complexity
  private handleHLSException = (_: any, data: ErrorData) => {
    console.error(this.TAG, `error type ${data.type} with details ${data.details} is fatal ${data.fatal}`);
    const details = data.error?.message || data.err?.message || '';
    const detail = {
      details: details,
      fatal: data.fatal,
    };
    if (!detail.fatal) {
      return;
    }
    switch (data.details) {
      case Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.manifestIncompatibleCodecsError(detail);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.FRAG_DECRYPT_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.fragDecryptError(detail);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR: {
        const error = HMSHLSErrorFactory.HLSMediaError.bufferIncompatibleCodecsError(detail);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      // Below ones are network related errors
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.manifestLoadError(detail);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.manifestParsingError(detail);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR: {
        const error = HMSHLSErrorFactory.HLSNetworkError.layerLoadError(detail);
        if (!navigator.onLine) {
          this.reConnectToStream();
        } else {
          this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        }
        break;
      }
      default: {
        const error = HMSHLSErrorFactory.HLSError(detail, data.type, data.details);
        this.emitEvent(HMSHLSPlayerEvents.ERROR, error);
        break;
      }
    }
  };
  private manifestLoadedHandler = (_: any, { levels }: { levels: LevelParsed[] }) => {
    const layers: HMSHLSLayer[] = mapLayers(this.removeAudioLevels(levels));
    this.emitEvent(HMSHLSPlayerEvents.MANIFEST_LOADED, {
      layers,
    });
  };
  private levelUpdatedHandler = (_: any, { level }: { level: number }) => {
    const qualityLayer: HMSHLSLayer = mapLayer(this._hls.levels[level]);
    this.emitEvent(HMSHLSPlayerEvents.LAYER_UPDATED, {
      layer: qualityLayer,
    });
  };

  private handleTimeUpdateListener = (_: Event) => {
    this.emitEvent(HMSHLSPlayerEvents.CURRENT_TIME, this._videoEl.currentTime);
    const live = this._hls.liveSyncPosition
      ? this._hls.liveSyncPosition - this._videoEl.currentTime <= HLS_DEFAULT_ALLOWED_MAX_LATENCY_DELAY
      : false;
    if (this._isLive !== live) {
      this._isLive = live;
      this.emitEvent(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, {
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
  /**
   * 1 min retries before user came online, reason room automatically disconnected if user is offline for more than 1mins
   * Retries logic will run exponential like (1, 2, 4, 8, 8, 8, 8, 8, 8, 8secs)
   * there will be total 10 retries
   */
  private getPlayerConfig(hlsUrl: string): Partial<HlsConfig> {
    const config: Partial<HlsConfig> = {
      enableWorker: true,
      maxBufferLength: 20,
      backBufferLength: 10,
      abrBandWidthUpFactor: 1,
      playlistLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 8000,
          maxLoadTimeMs: 20000,
          timeoutRetry: {
            maxNumRetry: 10,
            retryDelayMs: 1000,
            maxRetryDelayMs: 8000,
            backoff: 'exponential',
          },
          errorRetry: {
            maxNumRetry: 10,
            retryDelayMs: 1000,
            maxRetryDelayMs: 8000,
            backoff: 'exponential',
          },
        },
      },
    };

    // Enable credentials for authenticated HLS streams (paths containing /s/)
    // so the long-token cookie set by Media CDN is sent on subsequent requests
    try {
      const url = new URL(hlsUrl);
      if (url.pathname.includes('/s/')) {
        config.fetchSetup = function (context, initParams) {
          initParams.credentials = 'include';
          return new Request(context.url, initParams);
        };
        config.xhrSetup = function (xhr, _url: string) {
          xhr.withCredentials = true;
        };
      }
    } catch {
      // invalid URL, skip credentials setup
    }

    return config;
  }

  /**
   * @param {Array} levels array
   * @returns a new array with only video levels.
   */
  private removeAudioLevels(levels: LevelParsed[]) {
    return levels.filter(({ videoCodec, width, height }) => !!videoCodec || !!(width && height));
  }

  /**
   * @returns true if HLS player is supported in the browser
   */
  public static isSupported(): boolean {
    return Hls.isSupported();
  }
}
