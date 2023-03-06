import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSHLSException } from '../error/HMSHLSException';
import { ILevel } from '../interfaces/ILevel';
import { HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';

export interface HMSHLSPlayerListeners {
  [HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE]: (
    event: HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE,
    data: HMSHLSStreamLive,
  ) => void;
  [HMSHLSPlayerEvents.TIMED_METADATA_LOADED]: (
    event: HMSHLSPlayerEvents.TIMED_METADATA_LOADED,
    data: HMSHLSCue,
  ) => void;
  [HMSHLSPlayerEvents.PLAYBACK_STATE]: (event: HMSHLSPlayerEvents.PLAYBACK_STATE, data: HMSHLSPlaybackState) => void;

  [HMSHLSPlayerEvents.ERROR]: (event: HMSHLSPlayerEvents.ERROR, data: HMSHLSException) => void;
  [HMSHLSPlayerEvents.CURRENT_TIME]: (event: HMSHLSPlayerEvents.CURRENT_TIME, data: number) => void;
  [HMSHLSPlayerEvents.AUTOPLAY_BLOCKED]: (event: HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, data: boolean) => void;

  [HMSHLSPlayerEvents.MANIFEST_LOADED]: (event: HMSHLSPlayerEvents.MANIFEST_LOADED, data: HMSHLSManifestLoaded) => void;

  [HMSHLSPlayerEvents.LEVEL_UPDATED]: (event: HMSHLSPlayerEvents.LEVEL_UPDATED, data: HMSHLSLevelUpdated) => void;
}

export interface HMSHLSStreamLive {
  isLive: boolean;
}
export interface HMSHLSPlaybackState {
  state: HLSPlaybackState;
}
export interface HMSHLSCue {
  id?: string;
  payload: string;
  duration: number;
  startDate: Date;
  endDate?: Date;
}

export interface HMSHLSManifestLoaded {
  levels: ILevel[];
}
export interface HMSHLSLevelUpdated {
  level: ILevel;
}
export interface IHMSHLSPlayerEventEmitter {
  on<E extends keyof HMSHLSPlayerListeners>(event: E, listener: HMSHLSPlayerListeners[E], options?: boolean): void;

  off<E extends keyof HMSHLSPlayerListeners>(event: E, listener?: HMSHLSPlayerListeners[E]): void;
}

export class HMSHLSPlayerEventEmitter implements IHMSHLSPlayerEventEmitter {
  private eventEmitter: EventEmitter;
  constructor() {
    this.eventEmitter = new EventEmitter();
  }
  on<E extends keyof HMSHLSPlayerListeners>(event: E, listener: HMSHLSPlayerListeners[E], options?: boolean): void {
    this.eventEmitter.on(event, listener, options);
  }

  off<E extends keyof HMSHLSPlayerListeners>(event: E, listener: HMSHLSPlayerListeners[E]) {
    this.eventEmitter.off(event, listener);
  }

  emit<E extends keyof HMSHLSPlayerListeners>(
    event: E,
    name: E,
    eventObject: Parameters<HMSHLSPlayerListeners[E]>[1],
  ): boolean {
    return this.eventEmitter.emit(event, name, eventObject);
  }
}
