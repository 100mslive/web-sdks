import Hls from 'hls.js';
import { BaseAdapter } from '../adapters/BaseAdapter';
import { HlsJsAdapter } from '../adapters/HlsJsAdapter';
import { HlsPlayerStats } from '../interfaces';
import { IHlsStats } from '../interfaces/IHlsStats';

export class HlsStats implements IHlsStats {
  adapter: BaseAdapter;
  intervalFunctionId = -1;
  constructor(hlsLibraryInstance: Hls, videoEl: HTMLVideoElement) {
    const hlsJsAdapter = new HlsJsAdapter(hlsLibraryInstance, videoEl);
    this.adapter = hlsJsAdapter;
  }

  subscribe = (callback: (state: HlsPlayerStats) => void, interval = 2000) => {
    this.adapter.startGatheringStats();
    //@ts-ignore
    this.intervalFunctionId = setInterval(() => {
      callback(this.getState());
    }, interval);
    return this.unsubscribe;
  };
  unsubscribe = () => {
    clearInterval(this.intervalFunctionId);
    this.adapter.finishGatheringStats();
  };

  getState = () => {
    return this.adapter.getState();
  };
}
