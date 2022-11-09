import { BaseAdapter } from '../adapters/BaseAdapter';
import { HlsJsAdapter } from '../adapters/HlsJsAdapter';
import { HlsInstance, HlsPlayerStats } from '../interfaces';
import { IHlsStats } from '../interfaces/IHlsStats';

export class HlsStats implements IHlsStats {
  adapter: BaseAdapter;
  intervalFunctionId = -1;
  constructor(hlsLibraryInstance: HlsInstance, videoEl: HTMLVideoElement) {
    const hlsJsAdapter = new HlsJsAdapter(hlsLibraryInstance, videoEl);
    this.adapter = hlsJsAdapter;
  }

  subscribe(callback: (state: HlsPlayerStats) => void, interval = 2000) {
    this.adapter.startGatheringStats();
    //@ts-ignore
    this.intervalFunctionId = setInterval(() => {
      callback(this.getState());
    }, interval);
    return this.unsubscribe.bind(this);
  }
  unsubscribe() {
    clearInterval(this.intervalFunctionId);
    this.adapter.finishGatheringStats();
  }

  getState() {
    return this.adapter.getState();
  }
}
