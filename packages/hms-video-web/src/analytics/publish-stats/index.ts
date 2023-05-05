import { BaseSample, PublishAnalyticPayload, TrackAnalytics, VideoSample } from './interfaces';
import { EventBus } from '../../events/EventBus';
import { HMSLocalTrackStats, HMSTrackStats, RTCRemoteInboundRtpStreamStats } from '../../interfaces';
import { HMSLocalTrack } from '../../media/tracks';
import { HMSWebrtcStats } from '../../rtc-stats';
import { IStore } from '../../sdk/store';
import { PUBLISH_STATS_SAMPLE_WINDOW } from '../../utils/constants';

export class PublishStatsAnalytics {
  private sequenceNum = 1;
  private trackAnalytics: Map<string, RunningTrackAnalytics> = new Map();

  constructor(private store: IStore, private eventBus: EventBus) {
    this.eventBus.statsUpdate.subscribe(hmsStats => this.handleStatsUpdate(hmsStats));
  }

  toAnalytics(): PublishAnalyticPayload {
    const trackAnalyticValues = Array.from(this.trackAnalytics.values());
    return {
      audio: trackAnalyticValues
        .filter(trackAnalytic => trackAnalytic.track.type === 'audio')
        .map(trackAnalytic => trackAnalytic.toAnalytics()),
      video: trackAnalyticValues
        .filter(trackAnalytic => trackAnalytic.track.type === 'video')
        .map(trackAnalytic => trackAnalytic.toAnalytics()),
      joined_at: this.store.getRoom()?.joinedAt?.getMilliseconds()!,
      sequence_num: this.sequenceNum++,
      max_window_sec: PUBLISH_STATS_SAMPLE_WINDOW,
    };
  }

  private handleStatsUpdate(hmsStats: HMSWebrtcStats) {
    const localTracksStats = hmsStats.getLocalTrackStats();
    Object.keys(localTracksStats).forEach(trackIDBeingSent => {
      const trackStats = localTracksStats[trackIDBeingSent];
      const track = this.store.getLocalPeerTracks().find(track => track.getTrackIDBeingSent() === trackIDBeingSent);
      Object.keys(trackStats).forEach(statId => {
        const layerStats = trackStats[statId];
        const identifier = track && this.getTrackIdentifier(track?.trackId, layerStats);
        if (identifier && this.trackAnalytics.has(identifier)) {
          this.trackAnalytics.get(identifier)?.push(layerStats);
        } else {
          if (track) {
            const trackAnalytics = new RunningTrackAnalytics({
              track,
              rid: layerStats.rid,
              ssrc: layerStats.ssrc.toString(),
              kind: layerStats.kind,
            });
            this.trackAnalytics.set(this.getTrackIdentifier(track?.trackId, layerStats), trackAnalytics);
          }
        }
      });
    });
  }

  private getTrackIdentifier(trackId: string, stats: HMSTrackStats) {
    return stats.rid ? `${trackId}:${stats.rid}` : trackId;
  }
}

class RunningTrackAnalytics {
  track: HMSLocalTrack;
  track_id: string;
  source: string;
  ssrc: string;
  kind: string;
  rid?: string;
  samples: BaseSample[] = [];

  private tempStats: HMSLocalTrackStats[] = [];

  constructor({ track, ssrc, rid, kind }: { track: HMSLocalTrack; ssrc: string; kind: string; rid?: string }) {
    this.track = track;
    this.ssrc = ssrc;
    this.rid = rid;
    this.kind = kind;
    this.track_id = this.track.trackId;
    this.source = this.track.source!;
  }

  push(stat: HMSLocalTrackStats) {
    this.tempStats.push(stat);

    if (this.shouldCreateSample()) {
      this.samples.push(this.createSample());
      this.tempStats.length = 0;
    }
  }

  toAnalytics(): TrackAnalytics {
    return {
      track_id: this.track_id,
      ssrc: this.ssrc,
      source: this.source,
      rid: this.rid,
      samples: this.samples,
    };
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

    return (
      length === PUBLISH_STATS_SAMPLE_WINDOW || (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat))
    );
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
