import { LevelParsed } from 'hls.js';
import { HLSControllerEvents } from './constants';

export declare interface HLSControllerListeners {
  [HLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE]: (
    event: HLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE,
    data: HLSStreamLive,
  ) => void;
  [HLSControllerEvents.HLS_TIMED_METADATA_LOADED]: (
    event: HLSControllerEvents.HLS_TIMED_METADATA_LOADED,
    data: HLSTimedMetadataPayload,
  ) => void;

  [HLSControllerEvents.HLS_PLAY]: (event: HLSControllerEvents.HLS_PLAY, data: boolean) => void;
  [HLSControllerEvents.HLS_PAUSE]: (event: HLSControllerEvents.HLS_PAUSE, data: boolean) => void;
  [HLSControllerEvents.HLS_CURRENT_TIME]: (event: HLSControllerEvents.HLS_CURRENT_TIME, data: number) => void;
  [HLSControllerEvents.HLS_AUTOPLAY_BLOCKED]: (event: HLSControllerEvents.HLS_AUTOPLAY_BLOCKED, data: boolean) => void;

  [HLSControllerEvents.HLS_MANIFEST_LOADED]: (
    event: HLSControllerEvents.HLS_MANIFEST_LOADED,
    data: HLSManifestLoaded,
  ) => void;

  [HLSControllerEvents.HLS_LEVEL_UPDATED]: (
    event: HLSControllerEvents.HLS_LEVEL_UPDATED,
    data: HLSLevelUpdated,
  ) => void;
}

export declare interface HLSStreamLive {
  isLive: boolean;
}
export declare interface HLSTimedMetadataPayload {
  payload: string;
  duration: number;
  metadata: any;
}

export declare interface HLSManifestLoaded {
  levels: LevelParsed[];
}
export declare interface HLSLevelUpdated {
  level: LevelParsed;
}
export interface HlsControllerEventEmitter {
  on<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener: HLSControllerListeners[E],
    context?: Context,
  ): void;
  once<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener: HLSControllerListeners[E],
    context?: Context,
  ): void;

  removeAllListeners<E extends keyof HLSControllerListeners>(event?: E): void;
  off<E extends keyof HLSControllerListeners, Context = undefined>(
    event: E,
    listener?: HLSControllerListeners[E],
    context?: Context,
    once?: boolean,
  ): void;

  listeners<E extends keyof HLSControllerListeners>(event: E): HLSControllerListeners[E][];
  emit<E extends keyof HLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HLSControllerListeners[E]>[1],
  ): boolean;
  listenerCount<E extends keyof HLSControllerListeners>(event: E): number;
}
