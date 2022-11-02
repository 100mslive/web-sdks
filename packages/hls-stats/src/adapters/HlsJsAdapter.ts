import Hls from 'hls.js';
import { BaseAdapter } from './BaseAdapter';

export class HlsJsAdapter extends BaseAdapter {
  timeUpdateHandler = _ => {
    let totalBufferHealth = 0;

    for (let i = 0; i < this.videoEl.buffered.length; i++) {
      totalBufferHealth += this.videoEl.buffered.end(i) - this.videoEl.buffered.start(i);
    }

    this.hlsStatsState = {
      ...this.hlsStatsState,
      liveSyncPosition: this.hlsInstance?.liveSyncPosition as number,
      distanceFromLiveSync: this.hlsInstance?.liveSyncPosition
        ? this.hlsInstance?.liveSyncPosition - this.videoEl.currentTime
        : 0,
      bufferHealth: totalBufferHealth,
    };
  };

  levelLoadedHandler = (_, data) => {
    const { level } = data;
    const currentLevel = this.hlsInstance.levels[level];
    const { bitrate, height, width } = currentLevel;
    this.hlsStatsState = {
      ...this.hlsStatsState,
      bitrate,
      videoSize: {
        height,
        width,
      },
    };
  };

  fragChangedHandler = (_, { frag }) => {
    const { stats, baseurl } = frag;
    const { bwEstimate } = stats;

    this.hlsStatsState = {
      ...this.hlsStatsState,
      bandwidthEstimate: bwEstimate,
      url: baseurl,
    };
  };

  startGatheringStats(): void {
    console.log('Start Gathering stats');
    this.hlsInstance.on(Hls.Events.FRAG_CHANGED, this.fragChangedHandler);

    this.hlsInstance.on(Hls.Events.LEVEL_LOADED, this.levelLoadedHandler);
    this.videoEl.addEventListener('timeupdate', this.timeUpdateHandler);
  }

  finishGatheringStats(): void {
    this.videoEl.removeEventListener('timeupdate', this.timeUpdateHandler);
    this.hlsInstance.off(Hls.Events.FRAG_CHANGED, this.fragChangedHandler);
    this.hlsInstance.off(Hls.Events.LEVEL_LOADED, this.levelLoadedHandler);
  }
}
