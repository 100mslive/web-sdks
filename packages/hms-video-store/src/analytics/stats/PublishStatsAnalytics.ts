import {
  BaseStatsAnalytics,
  hasEnabledStateChanged,
  hasResolutionChanged,
  removeUndefinedFromObject,
  RunningTrackAnalytics,
} from './BaseStatsAnalytics';
import {
  LocalAudioTrackAnalytics,
  LocalBaseSample,
  LocalVideoSample,
  LocalVideoTrackAnalytics,
  PublishAnalyticPayload,
} from './interfaces';
import { HMSTrackStats } from '../../interfaces';
import { HMSWebrtcStats } from '../../rtc-stats';
import { PUBLISH_STATS_SAMPLE_WINDOW } from '../../utils/constants';
import AnalyticsEventFactory from '../AnalyticsEventFactory';

export class PublishStatsAnalytics extends BaseStatsAnalytics {
  protected trackAnalytics: Map<string, RunningLocalTrackAnalytics> = new Map();

  protected toAnalytics(): PublishAnalyticPayload {
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
  }

  protected sendEvent() {
    this.eventBus.analytics.publish(AnalyticsEventFactory.publishStats(this.toAnalytics()));
    super.sendEvent();
  }

  protected handleStatsUpdate(hmsStats: HMSWebrtcStats) {
    let shouldCreateSample = false;

    const localTracksStats = hmsStats.getLocalTrackStats();
    Object.keys(localTracksStats).forEach(trackIDBeingSent => {
      const trackStats = localTracksStats[trackIDBeingSent];
      const track = this.store.getLocalPeerTracks().find(track => track.getTrackIDBeingSent() === trackIDBeingSent);
      Object.keys(trackStats).forEach(statId => {
        const layerStats = trackStats[statId];
        if (!track) {
          return;
        }
        const identifier = this.getTrackIdentifier(track.trackId, layerStats);
        const newTempStats = {
          ...layerStats,
          availableOutgoingBitrate: hmsStats.getLocalPeerStats()?.publish?.availableOutgoingBitrate,
        };
        if (identifier && this.trackAnalytics.has(identifier)) {
          this.trackAnalytics.get(identifier)?.pushTempStat(newTempStats);
        } else {
          if (track) {
            const trackAnalytics = new RunningLocalTrackAnalytics({
              track,
              sampleWindowSize: this.sampleWindowSize,
              rid: layerStats.rid,
              ssrc: layerStats.ssrc.toString(),
              kind: layerStats.kind,
            });
            trackAnalytics.pushTempStat(newTempStats);
            this.trackAnalytics.set(this.getTrackIdentifier(track.trackId, layerStats), trackAnalytics);
          }
        }

        const trackAnalytics = this.trackAnalytics.get(identifier);
        if (trackAnalytics?.shouldCreateSample()) {
          shouldCreateSample = true;
        }
      });
    });

    // delete track analytics if track is not present in store and no samples are present
    this.trackAnalytics.forEach(trackAnalytic => {
      if (!this.store.hasTrack(trackAnalytic.track) && !(trackAnalytic.samples.length > 0)) {
        this.trackAnalytics.delete(trackAnalytic.track_id);
      }
    });

    if (shouldCreateSample) {
      this.trackAnalytics.forEach(trackAnalytic => {
        trackAnalytic.createSample();
      });
    }
  }

  private getTrackIdentifier(trackId: string, stats: HMSTrackStats) {
    return stats.rid ? `${trackId}:${stats.rid}` : trackId;
  }
}

class RunningLocalTrackAnalytics extends RunningTrackAnalytics {
  samples: (LocalBaseSample | LocalVideoSample)[] = [];

  protected collateSample = (): LocalBaseSample | LocalVideoSample => {
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
      total_packets_lost: this.getLatestStat().packetsLost,
      total_packets_sent: this.getLatestStat().packetsSent,
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

  shouldCreateSample = () => {
    const length = this.tempStats.length;
    const newStat = this.tempStats[length - 1];
    const prevStat = this.tempStats[length - 2];

    return (
      length === PUBLISH_STATS_SAMPLE_WINDOW ||
      hasEnabledStateChanged(newStat, prevStat) ||
      (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat))
    );
  };

  toAnalytics = (): LocalAudioTrackAnalytics | LocalVideoTrackAnalytics => {
    return {
      track_id: this.track_id,
      ssrc: this.ssrc,
      source: this.source,
      rid: this.rid,
      samples: this.samples,
    };
  };
}
