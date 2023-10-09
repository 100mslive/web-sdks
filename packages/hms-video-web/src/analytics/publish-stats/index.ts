import {
  BaseSample,
  LocalAudioTrackAnalytics,
  LocalVideoTrackAnalytics,
  PublishAnalyticPayload,
  SubscribeAnalyticPayload,
  VideoSample,
} from './interfaces';
import { EventBus } from '../../events/EventBus';
import { HMSTrackStats } from '../../interfaces';
import { HMSLocalTrack } from '../../media/tracks';
import { HMSWebrtcStats } from '../../rtc-stats';
import { IStore } from '../../sdk/store';
import { PUBLISH_STATS_PUSH_INTERVAL, PUBLISH_STATS_SAMPLE_WINDOW } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import { sleep } from '../../utils/timer-utils';
import AnalyticsEventFactory from '../AnalyticsEventFactory';

export abstract class BaseStatsAnalytics {
  private shouldSendEvent = false;
  protected sequenceNum = 1;

  constructor(
    protected store: IStore,
    protected eventBus: EventBus,
    protected readonly sampleWindowSize = PUBLISH_STATS_SAMPLE_WINDOW,
    protected readonly pushInterval = PUBLISH_STATS_PUSH_INTERVAL,
  ) {
    this.start();
  }

  start() {
    if (this.shouldSendEvent) {
      return;
    }
    this.stop();
    this.shouldSendEvent = true;
    this.eventBus.statsUpdate.subscribe(this.handleStatsUpdate);
    this.startLoop().catch(e => HMSLogger.e('[PublishStatsAnalytics]', e.message));
  }

  stop = () => {
    if (this.shouldSendEvent) {
      this.sendEvent();
    }
    this.eventBus.statsUpdate.unsubscribe(this.handleStatsUpdate);
    this.shouldSendEvent = false;
  };

  private async startLoop() {
    while (this.shouldSendEvent) {
      await sleep(this.pushInterval * 1000);
      this.sendEvent();
    }
  }

  protected abstract sendEvent: () => void;

  protected abstract toAnalytics: () => PublishAnalyticPayload | SubscribeAnalyticPayload;

  protected abstract handleStatsUpdate: (hmsStats: HMSWebrtcStats) => void;
}

export class PublishStatsAnalytics extends BaseStatsAnalytics {
  protected trackAnalytics: Map<string, RunningLocalTrackAnalytics> = new Map();

  protected toAnalytics = (): PublishAnalyticPayload => {
    const audio: LocalAudioTrackAnalytics[] = [];
    const video: LocalVideoTrackAnalytics[] = [];
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
  };

  protected sendEvent = () => {
    this.eventBus.analytics.publish(AnalyticsEventFactory.publishStats(this.toAnalytics()));
  };

  protected handleStatsUpdate = (hmsStats: HMSWebrtcStats) => {
    const localTracksStats = hmsStats.getLocalTrackStats();
    Object.keys(localTracksStats).forEach(trackIDBeingSent => {
      const trackStats = localTracksStats[trackIDBeingSent];
      const track = this.store.getLocalPeerTracks().find(track => track.getTrackIDBeingSent() === trackIDBeingSent);
      Object.keys(trackStats).forEach(statId => {
        const layerStats = trackStats[statId];
        const identifier = track && this.getTrackIdentifier(track?.trackId, layerStats);
        if (identifier && this.trackAnalytics.has(identifier)) {
          this.trackAnalytics.get(identifier)?.push({
            ...layerStats,
            availableOutgoingBitrate: hmsStats.getLocalPeerStats()?.publish?.availableOutgoingBitrate,
          });
        } else {
          if (track) {
            const trackAnalytics = new RunningLocalTrackAnalytics({
              track,
              sampleWindowSize: this.sampleWindowSize,
              rid: layerStats.rid,
              ssrc: layerStats.ssrc.toString(),
              kind: layerStats.kind,
            });
            trackAnalytics.push({
              ...layerStats,
              availableOutgoingBitrate: hmsStats.getLocalPeerStats()?.publish?.availableOutgoingBitrate,
            });
            this.trackAnalytics.set(this.getTrackIdentifier(track?.trackId, layerStats), trackAnalytics);
          }
        }
      });
    });
  };

  private getTrackIdentifier(trackId: string, stats: HMSTrackStats) {
    return stats.rid ? `${trackId}:${stats.rid}` : trackId;
  }
}

type TempPublishStats = HMSTrackStats & { availableOutgoingBitrate?: number };

abstract class RunningTrackAnalytics {
  readonly sampleWindowSize: number;
  track: HMSLocalTrack;
  track_id: string;
  source: string;
  ssrc: string;
  kind: string;
  rid?: string;
  samples: BaseSample[] = [];

  private tempStats: TempPublishStats[] = [];

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

  push(stat: TempPublishStats) {
    this.tempStats.push(stat);

    if (this.shouldCreateSample()) {
      this.samples.push(this.createSample());
      this.tempStats.length = 0;
    }
  }

  toAnalytics(): LocalVideoTrackAnalytics {
    return {
      track_id: this.track_id,
      ssrc: this.ssrc,
      source: this.source,
      rid: this.rid,
      samples: this.samples,
    };
  }

  protected abstract createSample: () => BaseSample | VideoSample;

  protected getLatestStat() {
    return this.tempStats[this.tempStats.length - 1];
  }

  protected shouldCreateSample() {
    const length = this.tempStats.length;
    const newStat = this.tempStats[length - 1];
    const prevStat = this.tempStats[length - 2];

    return (
      length === PUBLISH_STATS_SAMPLE_WINDOW ||
      hasEnabledStateChanged(newStat, prevStat) ||
      (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat))
    );
  }

  protected calculateSum(key: keyof TempPublishStats) {
    const checkStat = this.getLatestStat()[key];
    if (typeof checkStat !== 'number') {
      return;
    }
    return this.tempStats.reduce((partialSum, stat) => {
      return partialSum + ((stat[key] || 0) as number);
    }, 0);
  }

  protected calculateAverage(key: keyof TempPublishStats, round = true) {
    const sum = this.calculateSum(key);
    const avg = sum !== undefined ? sum / this.tempStats.length : undefined;
    return avg ? (round ? Math.round(avg) : avg) : undefined;
  }

  protected calculateDifferenceForSample(key: keyof TempPublishStats) {
    const firstValue = Number(this.tempStats[0][key]) || 0;
    const latestValue = Number(this.getLatestStat()[key]) || 0;

    return latestValue - firstValue;
  }
}

class RunningLocalTrackAnalytics extends RunningTrackAnalytics {
  protected createSample = (): BaseSample | VideoSample => {
    const latestStat = this.getLatestStat();

    const qualityLimitationDurations = latestStat.qualityLimitationDurations;
    const total_quality_limitation = qualityLimitationDurations && {
      bandwidth_sec: qualityLimitationDurations.bandwidth,
      cpu_sec: qualityLimitationDurations.cpu,
      other_sec: qualityLimitationDurations.other,
    };

    const resolution = latestStat.frameHeight
      ? {
          height_px: this.getLatestStat().frameHeight,
          width_px: this.getLatestStat().frameWidth,
        }
      : undefined;
    const avg_jitter = this.calculateAverage('jitter', false);
    const avg_jitter_ms = avg_jitter ? Math.round(avg_jitter * 1000) : undefined;

    const avg_round_trip_time = this.calculateAverage('roundTripTime', false);
    const avg_round_trip_time_ms = avg_round_trip_time ? Math.round(avg_round_trip_time * 1000) : undefined;

    return removeUndefinedFromObject({
      timestamp: Date.now(),
      avg_available_outgoing_bitrate_bps: this.calculateAverage('availableOutgoingBitrate'),
      avg_bitrate_bps: this.calculateAverage('bitrate'),
      avg_fps: this.calculateAverage('framesPerSecond'),
      total_packets_lost: this.calculateDifferenceForSample('packetsLost'),
      total_packets_sent: this.calculateDifferenceForSample('packetsSent'),
      total_packet_sent_delay_sec: parseFloat(this.calculateDifferenceForSample('totalPacketSendDelay').toFixed(4)),
      total_fir_count: this.calculateDifferenceForSample('firCount'),
      total_pli_count: this.calculateDifferenceForSample('pliCount'),
      total_nack_count: this.calculateDifferenceForSample('nackCount'),
      avg_jitter_ms,
      avg_round_trip_time_ms,
      total_quality_limitation,
      resolution,
    });
  };
}

const hasResolutionChanged = (newStat: TempPublishStats, prevStat: TempPublishStats) =>
  newStat && prevStat && (newStat.frameWidth !== prevStat.frameWidth || newStat.frameHeight !== prevStat.frameHeight);

const hasEnabledStateChanged = (newStat: TempPublishStats, prevStat: TempPublishStats) =>
  newStat && prevStat && newStat.enabled !== prevStat.enabled;

const removeUndefinedFromObject = <T extends Record<string, any>>(data: T) => {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .reduce((obj, [key, value]) => {
      obj[key as keyof T] = value;
      return obj;
    }, {} as T);
};
