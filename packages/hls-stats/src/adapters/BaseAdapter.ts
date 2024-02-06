import Hls from 'hls.js';
import { HlsPlayerStats } from '../interfaces';
export abstract class BaseAdapter {
  hlsInstance: Hls;
  videoEl: HTMLVideoElement;
  hlsStatsState: HlsPlayerStats = {};
  constructor(hlsInstance: Hls, videoEl: HTMLVideoElement) {
    this.hlsInstance = hlsInstance;
    this.videoEl = videoEl;
  }
  abstract startGatheringStats(): void;
  abstract finishGatheringStats(): void;
  getState() {
    return this.hlsStatsState;
  }
}
