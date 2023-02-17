import { LevelParsed } from 'hls.js';
import { HMSHLSControllerEvents } from '../utilies/constants';

export declare interface HMSHLSControllerListeners {
  [HMSHLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE]: (
    event: HMSHLSControllerEvents.HLS_STREAM_NO_LONGER_LIVE,
    data: HLSStreamLive,
  ) => void;
  [HMSHLSControllerEvents.HLS_TIMED_METADATA_LOADED]: (
    event: HMSHLSControllerEvents.HLS_TIMED_METADATA_LOADED,
    data: HLSTimedMetadataPayload,
  ) => void;

  [HMSHLSControllerEvents.HLS_PLAY]: (event: HMSHLSControllerEvents.HLS_PLAY, data: boolean) => void;
  [HMSHLSControllerEvents.HLS_PAUSE]: (event: HMSHLSControllerEvents.HLS_PAUSE, data: boolean) => void;
  [HMSHLSControllerEvents.HLS_CURRENT_TIME]: (event: HMSHLSControllerEvents.HLS_CURRENT_TIME, data: number) => void;
  [HMSHLSControllerEvents.HLS_AUTOPLAY_BLOCKED]: (
    event: HMSHLSControllerEvents.HLS_AUTOPLAY_BLOCKED,
    data: boolean,
  ) => void;

  [HMSHLSControllerEvents.HLS_MANIFEST_LOADED]: (
    event: HMSHLSControllerEvents.HLS_MANIFEST_LOADED,
    data: HLSManifestLoaded,
  ) => void;

  [HMSHLSControllerEvents.HLS_LEVEL_UPDATED]: (
    event: HMSHLSControllerEvents.HLS_LEVEL_UPDATED,
    data: HLSLevelUpdated,
  ) => void;
}

export declare interface HLSStreamLive {
  isLive: boolean;
}
export declare interface HLSTimedMetadataPayload {
  payload: string;
  duration: number;
}

export declare interface HLSManifestLoaded {
  levels: LevelParsed[];
}
export declare interface HLSLevelUpdated {
  level: LevelParsed;
}
export interface HMSHLSControllerEventEmitter {
  on<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    context?: Context,
  ): void;
  once<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    context?: Context,
  ): void;

  removeAllListeners<E extends keyof HMSHLSControllerListeners>(event?: E): void;
  off<E extends keyof HMSHLSControllerListeners, Context = undefined>(
    event: E,
    listener?: HMSHLSControllerListeners[E],
    context?: Context,
    once?: boolean,
  ): void;

  listeners<E extends keyof HMSHLSControllerListeners>(event: E): HMSHLSControllerListeners[E][];
  emit<E extends keyof HMSHLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HMSHLSControllerListeners[E]>[1],
  ): boolean;
  listenerCount<E extends keyof HMSHLSControllerListeners>(event: E): number;
}
