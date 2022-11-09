import { HlsInstance, HlsPlayerStats } from '../interfaces';

export abstract class BaseAdapter {
  hlsInstance: HlsInstance = {} as HlsInstance;
  videoEl: HTMLVideoElement;
  hlsStatsState: HlsPlayerStats = {};
  constructor(hlsInstance: HlsInstance, videoEl: HTMLVideoElement) {
    this.hlsInstance = hlsInstance;
    this.videoEl = videoEl;
  }
  abstract startGatheringStats(): void;
  abstract finishGatheringStats(): void;
  getState() {
    return this.hlsStatsState;
  }
}
