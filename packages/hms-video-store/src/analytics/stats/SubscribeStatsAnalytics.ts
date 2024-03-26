import {
  BaseStatsAnalytics,
  hasEnabledStateChanged,
  hasResolutionChanged,
  removeUndefinedFromObject,
  RunningTrackAnalytics,
} from './BaseStatsAnalytics';
import {
  RemoteAudioSample,
  RemoteAudioTrackAnalytics,
  RemoteVideoSample,
  RemoteVideoTrackAnalytics,
  SubscribeAnalyticPayload,
} from './interfaces';
import { HMSTrackStats } from '../../interfaces';
import { HMSWebrtcStats } from '../../rtc-stats';
import { MAX_SAFE_INTEGER, SUBSCRIBE_STATS_SAMPLE_WINDOW } from '../../utils/constants';
import AnalyticsEventFactory from '../AnalyticsEventFactory';

export class SubscribeStatsAnalytics extends BaseStatsAnalytics {
  protected trackAnalytics: Map<string, RunningRemoteTrackAnalytics> = new Map();

  protected toAnalytics(): SubscribeAnalyticPayload {
    const audio: RemoteAudioTrackAnalytics[] = [];
    const video: RemoteVideoTrackAnalytics[] = [];
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
      max_window_sec: SUBSCRIBE_STATS_SAMPLE_WINDOW,
    };
  }

  protected sendEvent() {
    this.eventBus.analytics.publish(AnalyticsEventFactory.subscribeStats(this.toAnalytics()));
    super.sendEvent();
  }

  protected handleStatsUpdate(hmsStats: HMSWebrtcStats) {
    const remoteTracksStats = hmsStats.getAllRemoteTracksStats();
    let shouldCreateSample = false;
    Object.keys(remoteTracksStats).forEach(trackID => {
      const trackStats = remoteTracksStats[trackID];
      const track = this.store.getTrackById(trackID);
      const calculatedJitterBufferDelay =
        trackStats.jitterBufferDelay &&
        trackStats.jitterBufferEmittedCount &&
        trackStats.jitterBufferDelay / trackStats.jitterBufferEmittedCount;

      const avSync = this.calculateAvSyncForStat(trackStats, hmsStats);
      if (this.trackAnalytics.has(trackID)) {
        this.trackAnalytics.get(trackID)?.pushTempStat({ ...trackStats, calculatedJitterBufferDelay, avSync });
      } else {
        if (track) {
          const trackAnalytics = new RunningRemoteTrackAnalytics({
            track,
            sampleWindowSize: this.sampleWindowSize,
            ssrc: trackStats.ssrc.toString(),
            kind: trackStats.kind,
          });
          trackAnalytics.pushTempStat({ ...trackStats, calculatedJitterBufferDelay, avSync });
          this.trackAnalytics.set(trackID, trackAnalytics);
        }
      }
      const trackAnalytics = this.trackAnalytics.get(trackID);
      if (trackAnalytics?.shouldCreateSample()) {
        shouldCreateSample = true;
      }
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

  // eslint-disable-next-line complexity
  private calculateAvSyncForStat(trackStats: HMSTrackStats, hmsStats: HMSWebrtcStats) {
    if (!trackStats.peerID || !trackStats.estimatedPlayoutTimestamp || trackStats.kind !== 'video') {
      return;
    }
    const peer = this.store.getPeerById(trackStats.peerID);
    const audioTrack = peer?.audioTrack;
    const videoTrack = peer?.videoTrack;
    /**
     * 1. Send value as MAX_SAFE_INTEGER when either audio or value track is muted for the entire window
     * 2. When both audio and video are unmuted for a part of window , then divide the difference by those many number of samples only
     */
    const areBothTracksEnabled = audioTrack && videoTrack && audioTrack.enabled && videoTrack.enabled;
    if (!areBothTracksEnabled) {
      return MAX_SAFE_INTEGER;
    }
    const audioStats = hmsStats.getRemoteTrackStats(audioTrack.trackId);
    if (!audioStats) {
      return MAX_SAFE_INTEGER;
    }
    if (!audioStats.estimatedPlayoutTimestamp) {
      return;
    }

    // https://w3c.github.io/webrtc-stats/#dom-rtcinboundrtpstreamstats-estimatedplayouttimestamp
    return audioStats.estimatedPlayoutTimestamp - trackStats.estimatedPlayoutTimestamp;
  }
}

class RunningRemoteTrackAnalytics extends RunningTrackAnalytics {
  samples: (RemoteAudioSample | RemoteVideoSample)[] = [];

  protected collateSample = (): RemoteAudioSample | RemoteVideoSample => {
    const latestStat = this.getLatestStat();
    const firstStat = this.getFirstStat();

    const baseSample = {
      timestamp: Date.now(),
      total_pli_count: this.calculateDifferenceForSample('pliCount'),
      total_nack_count: this.calculateDifferenceForSample('nackCount'),
      avg_jitter_buffer_delay: this.calculateAverage('calculatedJitterBufferDelay', false),
    };

    if (latestStat.kind === 'video') {
      return removeUndefinedFromObject<RemoteVideoSample>({
        ...baseSample,
        avg_av_sync_ms: this.calculateAvgAvSyncForSample(),
        avg_frames_received_per_sec: this.calculateDifferenceAverage('framesReceived'),
        avg_frames_dropped_per_sec: this.calculateDifferenceAverage('framesDropped'),
        avg_frames_decoded_per_sec: this.calculateDifferenceAverage('framesDecoded'),
        frame_width: this.calculateAverage('frameWidth'),
        frame_height: this.calculateAverage('frameHeight'),
        pause_count: this.calculateDifferenceForSample('pauseCount'),
        pause_duration_seconds: this.calculateDifferenceForSample('totalPausesDuration'),
        freeze_count: this.calculateDifferenceForSample('freezeCount'),
        freeze_duration_seconds: this.calculateDifferenceForSample('totalFreezesDuration'),
      });
    } else {
      const audio_concealed_samples =
        (latestStat.concealedSamples || 0) -
        (latestStat.silentConcealedSamples || 0) -
        ((firstStat.concealedSamples || 0) - (firstStat.silentConcealedSamples || 0));

      return removeUndefinedFromObject<RemoteAudioSample>({
        ...baseSample,
        audio_level: this.calculateInstancesOfHigh('audioLevel', 0.05),
        audio_concealed_samples,
        audio_total_samples_received: this.calculateDifferenceForSample('totalSamplesReceived'),
        audio_concealment_events: this.calculateDifferenceForSample('concealmentEvents'),
        fec_packets_discarded: this.calculateDifferenceForSample('fecPacketsDiscarded'),
        fec_packets_received: this.calculateDifferenceForSample('fecPacketsReceived'),
        total_samples_duration: this.calculateDifferenceForSample('totalSamplesDuration'),
        total_packets_received: this.calculateDifferenceForSample('packetsReceived'),
        total_packets_lost: this.calculateDifferenceForSample('packetsLost'),
      });
    }
  };

  shouldCreateSample = () => {
    const length = this.tempStats.length;
    const newStat = this.tempStats[length - 1];
    const prevStat = this.tempStats[length - 2];

    return (
      length === SUBSCRIBE_STATS_SAMPLE_WINDOW ||
      hasEnabledStateChanged(newStat, prevStat) ||
      (newStat.kind === 'video' && hasResolutionChanged(newStat, prevStat))
    );
  };

  toAnalytics = (): RemoteAudioTrackAnalytics | RemoteVideoTrackAnalytics => {
    return {
      track_id: this.track_id,
      ssrc: this.ssrc,
      source: this.source,
      rid: this.rid,
      samples: this.samples,
    };
  };

  private calculateAvgAvSyncForSample() {
    const avSyncValues = this.tempStats.map(stat => stat.avSync);
    const validAvSyncValues: number[] = avSyncValues.filter(
      (value): value is number => value !== undefined && value !== MAX_SAFE_INTEGER,
    );
    if (validAvSyncValues.length === 0) {
      return MAX_SAFE_INTEGER;
    }
    return validAvSyncValues.reduce((a, b) => a + b, 0) / validAvSyncValues.length;
  }
}
