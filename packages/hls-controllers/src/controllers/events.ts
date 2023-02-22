import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { ILevel } from '../interfaces/ILevel';
import { HMSHLSControllerEvents } from '../utilies/constants';

export interface HMSHLSControllerListeners {
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

export interface HLSStreamLive {
  isLive: boolean;
}
export interface HLSTimedMetadataPayload {
  payload: string;
  duration: number;
}

export interface HLSManifestLoaded {
  levels: ILevel[];
}
export interface HLSLevelUpdated {
  level: ILevel;
}
export interface IHMSHLSControllerEventEmitter {
  on<E extends keyof HMSHLSControllerListeners>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    options?: boolean,
  ): void;
  once<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]): void;

  removeAllListeners<E extends keyof HMSHLSControllerListeners>(event?: E): void;
  off<E extends keyof HMSHLSControllerListeners>(event: E, listener?: HMSHLSControllerListeners[E]): void;

  listeners<E extends keyof HMSHLSControllerListeners>(event: E): HMSHLSControllerListeners[E][];
  listenerCount<E extends keyof HMSHLSControllerListeners>(event: E): number;
}

export class HMSHLSControllerEventEmitter implements IHMSHLSControllerEventEmitter {
  constructor(private eventEmitter: EventEmitter) {}
  on<E extends keyof HMSHLSControllerListeners>(
    event: E,
    listener: HMSHLSControllerListeners[E],
    options?: boolean,
  ): void {
    this.eventEmitter.on(event, listener, options);
  }

  once<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]) {
    this.eventEmitter.once(event, listener);
  }

  removeAllListeners<E extends keyof HMSHLSControllerListeners>(event?: E) {
    this.eventEmitter.removeAllListeners(event);
  }
  off<E extends keyof HMSHLSControllerListeners>(event: E, listener: HMSHLSControllerListeners[E]) {
    this.eventEmitter.off(event, listener);
  }

  listeners<E extends keyof HMSHLSControllerListeners>(event: E): HMSHLSControllerListeners[E][] {
    return this.eventEmitter.listeners(event);
  }
  emit<E extends keyof HMSHLSControllerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HMSHLSControllerListeners[E]>[1],
  ): boolean {
    return this.eventEmitter.emit(event, name, eventObject);
  }
  listenerCount<E extends keyof HMSHLSControllerListeners>(event: E): number {
    return this.eventEmitter.listenerCount(event);
  }
}
