import { BaseSample, TrackAnalytics, VideoSample } from './interfaces';
import { EventBus } from '../../events/EventBus';
import { HMSLocalTrackStats, HMSTrackStats, RTCRemoteInboundRtpStreamStats } from '../../interfaces';
import { HMSWebrtcStats } from '../../rtc-stats';
import { IStore } from '../../sdk/store';

const SAMPLE_WINDOW = 30;

export class PublishStatsAnalytics {
  private trackAnalytics: Map<string, RunningTrackAnalytics> = new Map();

  constructor(private store: IStore, private eventBus: EventBus) {
    this.eventBus.statsUpdate.subscribe(hmsStats => this.handleStatsUpdate(hmsStats));
  }

  private handleStatsUpdate(hmsStats: HMSWebrtcStats) {
    const localTracksStats = hmsStats.getLocalTrackStats();
    Object.keys(localTracksStats).forEach(trackId => {
      const trackStats = localTracksStats[trackId];
      Object.keys(trackStats).forEach(statId => {
        const layerStats = trackStats[statId];
        const identifier = this.getTrackIdentifier(trackId, layerStats);
        if (this.trackAnalytics.has(identifier)) {
          this.trackAnalytics.get(identifier)?.push(layerStats);
        } else {
          const source = this.store.getTrackById(trackId)?.source!;
          const trackAnalytics = new RunningTrackAnalytics({
            trackId,
            rid: layerStats.rid,
            ssrc: layerStats.ssrc.toString(),
            kind: layerStats.kind,
            source,
          });
          this.trackAnalytics.set(identifier, trackAnalytics);
        }
      });
    });
  }

  private getTrackIdentifier(trackId: string, stats: HMSTrackStats) {
    return stats.rid ? `${trackId}:${stats.rid}` : trackId;
  }
}

class RunningTrackAnalytics implements TrackAnalytics {
  track_id: string;
  ssrc: string;
  source: string;
  kind: string;
  rid?: string;
  samples: BaseSample[] = [];

  private tempStats: HMSLocalTrackStats[] = [];

  constructor({
    trackId,
    ssrc,
    source,
    rid,
    kind,
  }: {
    trackId: string;
    ssrc: string;
    source: string;
    kind: string;
    rid?: string;
  }) {
    this.track_id = trackId;
    this.ssrc = ssrc;
    this.source = source;
    this.rid = rid;
    this.kind = kind;
  }

  push(stat: HMSLocalTrackStats) {
    this.tempStats.push(stat);

    if (this.shouldCreateSample()) {
      this.samples.push(this.createSample());
      this.tempStats.length = 0;
    }
  }

  private createSample(): BaseSample | VideoSample {
    return {
      timestamp: Date.now(),
      avg_bitrate: this.calculateAverage('bitrate'),
      avg_fps: this.calculateAverage('framesPerSecond'),
      avg_jitter: this.calculateAverage('jitter'),
      avg_round_trip_time: this.calculateAverage('roundTripTime'),
      total_packets_lost: this.calculateSum('packetsLost'),
      // @ts-expect-error
      total_quality_limitation: this.getLatestStat().qualityLimitationDurations,
      resolution:
        this.kind === 'video'
          ? {
              height: this.getLatestStat().frameHeight,
              width: this.getLatestStat().frameWidth,
            }
          : undefined,
    };
  }

  private getLatestStat() {
    return this.tempStats[this.tempStats.length - 1];
  }

  private shouldCreateSample() {
    const length = this.tempStats.length;
    const newStat = this.tempStats[length - 1];
    const prevStat = this.tempStats[length - 2];

    const hasResolutionChanged = (newStat: HMSLocalTrackStats, prevStat: HMSLocalTrackStats) =>
      newStat &&
      prevStat &&
      (newStat.frameWidth !== prevStat.frameWidth || newStat.frameHeight !== prevStat.frameHeight);

    return length === SAMPLE_WINDOW || (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat));
  }

  private calculateSum(key: keyof RTCRemoteInboundRtpStreamStats | keyof HMSLocalTrackStats) {
    const checkStat = this.getLatestStat()[key as keyof HMSLocalTrackStats];
    if (typeof checkStat !== 'number') {
      return;
    }
    return this.tempStats.reduce((partialSum, stat) => {
      return partialSum + ((stat[key as keyof HMSLocalTrackStats] || 0) as number);
    }, 0);
  }

  private calculateAverage(key: keyof RTCRemoteInboundRtpStreamStats | keyof HMSLocalTrackStats) {
    const sum = this.calculateSum(key);
    return sum ? sum / this.tempStats.length : undefined;
  }
}
