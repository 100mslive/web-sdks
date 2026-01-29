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
import { CPUPressureMonitor } from '../../utils/cpu-pressure-monitor';
import AnalyticsEventFactory from '../AnalyticsEventFactory';

export class PublishStatsAnalytics extends BaseStatsAnalytics {
  protected trackAnalytics: Map<string, RunningLocalTrackAnalytics> = new Map();
  private cpuPressureMonitor?: CPUPressureMonitor;

  constructor(store: any, eventBus: any, sampleWindowSize: number, pushInterval: number) {
    super(store, eventBus, sampleWindowSize, pushInterval);
    // Initialize CPU pressure monitoring
    this.cpuPressureMonitor = new CPUPressureMonitor();
  }

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

  stop() {
    super.stop();
    this.cpuPressureMonitor?.stop();
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
              cpuPressureMonitor: this.cpuPressureMonitor,
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

    this.cleanTrackAnalyticsAndCreateSample(shouldCreateSample);
  }

  private getTrackIdentifier(trackId: string, stats: HMSTrackStats) {
    return stats.rid ? `${trackId}:${stats.rid}` : trackId;
  }
}

class RunningLocalTrackAnalytics extends RunningTrackAnalytics {
  samples: (LocalBaseSample | LocalVideoSample)[] = [];
  private cpuPressureMonitor?: CPUPressureMonitor;

  constructor(params: {
    track: any;
    sampleWindowSize: number;
    rid?: string;
    ssrc: string;
    kind: string;
    cpuPressureMonitor?: CPUPressureMonitor;
  }) {
    super(params);
    this.cpuPressureMonitor = params.cpuPressureMonitor;
  }

  private getQualityLimitation = (latestStat: HMSTrackStats) => {
    const qualityLimitationDurations = latestStat.qualityLimitationDurations;
    return (
      qualityLimitationDurations && {
        bandwidth_sec: qualityLimitationDurations.bandwidth,
        cpu_sec: qualityLimitationDurations.cpu,
        other_sec: qualityLimitationDurations.other,
      }
    );
  };

  private getSourceStats = (latestStat: HMSTrackStats) => {
    if (!latestStat.sourceStatsAvailable) {
      return {};
    }
    const source_resolution = latestStat.sourceFrameHeight
      ? { height_px: latestStat.sourceFrameHeight, width_px: latestStat.sourceFrameWidth }
      : undefined;
    const source_total_frames = this.calculateDifferenceForSample('sourceFrames');
    const frames_encoded = this.calculateDifferenceForSample('framesEncoded');
    // Compute frames dropped as difference between captured and encoded frames
    const source_total_frames_dropped =
      source_total_frames && frames_encoded ? Math.max(0, source_total_frames - frames_encoded) : undefined;
    return {
      source_resolution,
      source_avg_fps: this.calculateAverage('sourceFramesPerSecond'),
      source_total_frames,
      source_total_frames_dropped,
    };
  };

  protected collateSample = (): LocalBaseSample | LocalVideoSample => {
    const latestStat = this.getLatestStat();

    const resolution = latestStat.frameHeight
      ? { height_px: latestStat.frameHeight, width_px: latestStat.frameWidth }
      : undefined;
    const avg_jitter = this.calculateAverage('jitter', false);
    const avg_round_trip_time = this.calculateAverage('roundTripTime', false);

    // Capture worst CPU state for this sample window, then reset for next window
    const cpu_pressure_state = this.cpuPressureMonitor?.getWorstState();
    this.cpuPressureMonitor?.resetWorstState();
    // Get track settings from native track
    const track_settings = this.track.getMediaTrackSettings?.();

    // Get effects metrics if available (video tracks only)
    const effects_metrics = this.track.getPluginsMetrics?.();
    return removeUndefinedFromObject({
      timestamp: Date.now(),
      avg_available_outgoing_bitrate_bps: this.calculateAverage('availableOutgoingBitrate'),
      avg_bitrate_bps: this.calculateAverage('bitrate'),
      avg_fps: this.calculateAverage('framesPerSecond'),
      total_packets_lost: latestStat.packetsLost,
      total_packets_sent: latestStat.packetsSent,
      total_packet_sent_delay_sec: parseFloat(this.calculateDifferenceForSample('totalPacketSendDelay').toFixed(4)),
      total_fir_count: this.calculateDifferenceForSample('firCount'),
      total_pli_count: this.calculateDifferenceForSample('pliCount'),
      total_nack_count: this.calculateDifferenceForSample('nackCount'),
      avg_jitter_ms: avg_jitter ? Math.round(avg_jitter * 1000) : undefined,
      avg_round_trip_time_ms: avg_round_trip_time ? Math.round(avg_round_trip_time * 1000) : undefined,
      total_quality_limitation: this.getQualityLimitation(latestStat),
      resolution,
      cpu_pressure_state,
      track_settings,
      effects_metrics: effects_metrics && Object.keys(effects_metrics).length > 0 ? effects_metrics : undefined,
      ...this.getSourceStats(latestStat),
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
