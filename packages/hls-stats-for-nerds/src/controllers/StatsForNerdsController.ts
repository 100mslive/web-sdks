import { BaseAdapter } from '../adapters/BaseAdapter';
import { HlsJsAdapter } from '../adapters/HlsJsAdapter';
import { HlsInstance, HlsPlayerStats } from '../interfaces';

export class StatsForNerdsController {
  adapter: BaseAdapter;
  intervalFunctionId = -1;
  constructor(hlsLibraryInstance: HlsInstance, videoEl: HTMLVideoElement) {
    const hlsJsAdapter = new HlsJsAdapter(hlsLibraryInstance, videoEl);
    this.adapter = hlsJsAdapter;
  }

  subscribe(interval: number, callback: (state: HlsPlayerStats) => void) {
    this.adapter.startGatheringStats();
    //@ts-ignore
    this.intervalFunctionId = setInterval(() => {
      callback(this.getState());
    }, interval);
  }
  unsubscribe() {
    clearInterval(this.intervalFunctionId);
    this.adapter.finishGatheringStats();
  }

  getState() {
    return this.adapter.getState();
  }
}
