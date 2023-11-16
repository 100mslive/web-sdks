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
import { HMSWebrtcStats } from '../../rtc-stats';
import { SUBSCRIBE_STATS_SAMPLE_WINDOW } from '../../utils/constants';
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
  }

  protected handleStatsUpdate(hmsStats: HMSWebrtcStats) {
    const remoteTracksStats = hmsStats.getAllRemoteTracksStats();
    Object.keys(remoteTracksStats).forEach(trackID => {
      const trackStats = remoteTracksStats[trackID];
      const track = this.store.getTrackById(trackID);
      if (this.trackAnalytics.has(trackID)) {
        this.trackAnalytics.get(trackID)?.push({ ...trackStats });
      } else {
        if (track) {
          const trackAnalytics = new RunningRemoteTrackAnalytics({
            track,
            sampleWindowSize: this.sampleWindowSize,
            ssrc: trackStats.ssrc.toString(),
            kind: trackStats.kind,
          });
          trackAnalytics.push({ ...trackStats });
          this.trackAnalytics.set(trackID, trackAnalytics);
        }
      }
    });
  }
}

class RunningRemoteTrackAnalytics extends RunningTrackAnalytics {
  samples: (RemoteAudioSample | RemoteVideoSample)[] = [];

  protected createSample = (): RemoteAudioSample | RemoteVideoSample => {
    const latestStat = this.getLatestStat();
    const firstStat = this.getFirstStat();

    const baseSample = {
      timestamp: Date.now(),
      fec_packets_discarded: this.calculateDifferenceForSample('fecPacketsDiscarded'),
      fec_packets_received: this.calculateDifferenceForSample('fecPacketsReceived'),
      total_samples_duration: this.calculateDifferenceForSample('totalSamplesDuration'),
      total_packets_received: this.calculateDifferenceForSample('packetsReceived'),
      total_packets_lost: this.calculateDifferenceForSample('packetsLost'),
      total_pli_count: this.calculateDifferenceForSample('pliCount'),
      total_nack_count: this.calculateDifferenceForSample('nackCount'),
    };

    if (latestStat.kind === 'video') {
      return removeUndefinedFromObject<RemoteAudioSample | RemoteVideoSample>(baseSample);
    } else {
      const audio_concealed_samples =
        (latestStat.concealedSamples || 0) -
        (latestStat.silentConcealedSamples || 0) -
        ((firstStat.concealedSamples || 0) - (firstStat.silentConcealedSamples || 0));

      return removeUndefinedFromObject<RemoteAudioSample>(
        Object.assign(baseSample, {
          audio_concealed_samples,
          audio_level: this.calculateInstancesOfHigh('audioLevel', 0.05),
          audio_total_samples_received: this.calculateDifferenceForSample('totalSamplesReceived'),
          audio_concealment_events: this.calculateDifferenceForSample('concealmentEvents'),
        }),
      );
    }
  };

  protected shouldCreateSample = () => {
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
}
