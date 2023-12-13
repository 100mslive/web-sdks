import { HlsPlayerStats } from '@100mslive/hls-stats';
import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSHLSLayer } from './IHMSHLSLayer';
import { HMSHLSException } from '../error/HMSHLSException';
import { HLSPlaybackState, HMSHLSPlayerEvents } from '../utilies/constants';

type HMSHLSListenerDataMapping = {
  [HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE]: HMSHLSStreamLive;
  [HMSHLSPlayerEvents.TIMED_METADATA_LOADED]: HMSHLSCue;
  [HMSHLSPlayerEvents.STATS]: HlsPlayerStats;
  [HMSHLSPlayerEvents.PLAYBACK_STATE]: HMSHLSPlaybackState;
  [HMSHLSPlayerEvents.CAPTION_ENABLED]: boolean;

  [HMSHLSPlayerEvents.ERROR]: HMSHLSException;
  [HMSHLSPlayerEvents.CURRENT_TIME]: number;
  [HMSHLSPlayerEvents.AUTOPLAY_BLOCKED]: HMSHLSException;

  [HMSHLSPlayerEvents.MANIFEST_LOADED]: HMSHLSManifestLoaded;
  [HMSHLSPlayerEvents.LAYER_UPDATED]: HMSHLSLayerUpdated;
};

export type HMSHLSPlayerListeners<E extends HMSHLSPlayerEvents> = (data: HMSHLSListenerDataMapping[E], name: E) => void;

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
  layers: HMSHLSLayer[];
}
export interface HMSHLSLayerUpdated {
  layer: HMSHLSLayer;
}
export interface IHMSHLSPlayerEventEmitter {
  on<E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>): void;

  off<E extends HMSHLSPlayerEvents>(eventName: E, listener?: HMSHLSPlayerListeners<E>): void;
}

export class HMSHLSPlayerEventEmitter implements IHMSHLSPlayerEventEmitter {
  private eventEmitter: EventEmitter;
  constructor() {
    this.eventEmitter = new EventEmitter();
  }
  on<E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>): void {
    this.eventEmitter.on(eventName, listener);
  }

  off<E extends HMSHLSPlayerEvents>(eventName: E, listener: HMSHLSPlayerListeners<E>) {
    this.eventEmitter.off(eventName, listener);
  }

  emitEvent<E extends HMSHLSPlayerEvents>(eventName: E, eventObject: Parameters<HMSHLSPlayerListeners<E>>[0]): boolean {
    return this.eventEmitter.emit(eventName, eventObject, eventName);
  }

  removeAllListeners<E extends HMSHLSPlayerEvents>(eventName?: E): void {
    this.eventEmitter.removeAllListeners(eventName);
  }
}
