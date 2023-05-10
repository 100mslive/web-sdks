import { BaseSample, PublishAnalyticPayload, TrackAnalytics, VideoSample } from './interfaces';
import { EventBus } from '../../events/EventBus';
import { HMSLocalTrackStats, HMSTrackStats, RTCRemoteInboundRtpStreamStats } from '../../interfaces';
import { HMSLocalTrack } from '../../media/tracks';
import { HMSWebrtcStats } from '../../rtc-stats';
import { IStore } from '../../sdk/store';
import { PUBLISH_STATS_PUSH_INTERVAL, PUBLISH_STATS_SAMPLE_WINDOW } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import { sleep } from '../../utils/timer-utils';
import AnalyticsEventFactory from '../AnalyticsEventFactory';

export class PublishStatsAnalytics {
  private shouldSendEvent = false;
  private sequenceNum = 1;
  private trackAnalytics: Map<string, RunningTrackAnalytics> = new Map();

  constructor(
    private store: IStore,
    private eventBus: EventBus,
    private readonly sampleWindowSize = PUBLISH_STATS_SAMPLE_WINDOW,
    private readonly pushInterval = PUBLISH_STATS_PUSH_INTERVAL,
  ) {
    this.eventBus.statsUpdate.subscribe(hmsStats => this.handleStatsUpdate(hmsStats));
  }

  async start() {
    if (this.shouldSendEvent) {
      return;
    }
    this.stop();
    this.shouldSendEvent = true;
    this.startLoop().catch(e => HMSLogger.e('[PublishStatsAnalytics]', e.message));
  }

  stop() {
    this.shouldSendEvent = false;
  }

  private async startLoop() {
    while (this.shouldSendEvent) {
      await sleep(this.pushInterval * 1000);
      this.eventBus.analytics.publish(AnalyticsEventFactory.publishStats(this.toAnalytics()));
    }
  }

  private toAnalytics(): PublishAnalyticPayload {
    const audio: TrackAnalytics[] = [];
    const video: TrackAnalytics[] = [];
    this.trackAnalytics.forEach(trackAnalytic => {
      if (trackAnalytic.track.type === 'audio') {
        audio.push(trackAnalytic.toAnalytics());
      } else if (trackAnalytic.track.type === 'video') {
        video.push(trackAnalytic.toAnalytics());
      }
    });
    return {
      audio,
      video,
      joined_at: this.store.getRoom()?.joinedAt?.getTime()!,
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
              sampleWindowSize: this.sampleWindowSize,
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
  readonly sampleWindowSize: number;
  track: HMSLocalTrack;
  track_id: string;
  source: string;
  ssrc: string;
  kind: string;
  rid?: string;
  samples: BaseSample[] = [];

  private tempStats: HMSLocalTrackStats[] = [];

  constructor({
    track,
    ssrc,
    rid,
    kind,
    sampleWindowSize,
  }: {
    track: HMSLocalTrack;
    ssrc: string;
    kind: string;
    rid?: string;
    sampleWindowSize: number;
  }) {
    this.track = track;
    this.ssrc = ssrc;
    this.rid = rid;
    this.kind = kind;
    this.track_id = this.track.trackId;
    this.source = this.track.source!;
    this.sampleWindowSize = sampleWindowSize;
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

    return (
      length === PUBLISH_STATS_SAMPLE_WINDOW ||
      hasEnabledStateChanged(newStat, prevStat) ||
      (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat))
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

const hasResolutionChanged = (newStat: HMSLocalTrackStats, prevStat: HMSLocalTrackStats) =>
  newStat && prevStat && (newStat.frameWidth !== prevStat.frameWidth || newStat.frameHeight !== prevStat.frameHeight);

const hasEnabledStateChanged = (newStat: HMSLocalTrackStats, prevStat: HMSLocalTrackStats) =>
  newStat && prevStat && newStat.enabled !== prevStat.enabled;
