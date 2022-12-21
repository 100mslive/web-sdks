import Hls from 'hls.js';
import { BaseAdapter } from './BaseAdapter';

export class HlsJsAdapter extends BaseAdapter {
  timeUpdateHandler = () => {
    const bufferedDuration =
      this.videoEl.buffered.length > 0 ? this.videoEl.buffered.end(0) - this.videoEl.buffered.start(0) : 0;
    const distanceFromLive =
      (this.hlsInstance.liveSyncPosition ? this.hlsInstance.liveSyncPosition - this.videoEl.currentTime : 0) * 1000;
    const quality = this.videoEl.getVideoPlaybackQuality();
    const droppedFrames = quality.droppedVideoFrames;
    this.hlsStatsState = {
      ...this.hlsStatsState,
      distanceFromLive: distanceFromLive > 0 ? distanceFromLive : 0,
      bufferedDuration,
      droppedFrames,
    };
  };

  levelLoadedHandler = (_: any, { level }: { level: number }) => {
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

  fragChangedHandler = (_: any, { frag }: { frag: { stats: { bwEstimate: number }; baseurl: string } }) => {
    const { stats, baseurl } = frag;
    const { bwEstimate } = stats;
    this.hlsStatsState = {
      ...this.hlsStatsState,
      bandwidthEstimate: bwEstimate,
      url: baseurl,
    };
  };

  startGatheringStats(): void {
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
