import { TempStats } from './BaseStatsAnalytics';
import { LocalAudioSample, LocalVideoSample } from './interfaces';
import { RunningLocalTrackAnalytics } from './PublishStatsAnalytics';

// The aggregator only reaches for trackId/source and the two optional metric getters, so a
// plain object stands in for HMSTrack rather than a full media-stack fixture.
const fakeTrack = () => ({
  trackId: 'track-1',
  source: 'regular',
  getMediaTrackSettings: () => ({ echoCancellation: true }),
  getPluginsMetrics: () => ({}),
});

const makeAnalytics = (kind: string) =>
  new RunningLocalTrackAnalytics({
    track: fakeTrack(),
    ssrc: '1',
    kind,
    sampleWindowSize: 30,
  });

const collate = (kind: string, stats: Partial<TempStats>[]) => {
  const analytics = makeAnalytics(kind);
  stats.forEach((stat, index) => analytics.pushTempStat({ timestamp: 1000 + index * 1000, ...stat } as TempStats));
  analytics.createSample();
  return analytics.samples[0] as LocalAudioSample & LocalVideoSample;
};

describe('RunningLocalTrackAnalytics — audio source stats', () => {
  test('does not emit video frame counters on audio samples', () => {
    // Audio tracks resolve a media-source (for ERLE), which sets sourceStatsAvailable. The
    // frame counters coerce missing values to 0, so without a kind gate they would ship as
    // a real "0 frames captured" on every audio sample.
    const sample = collate('audio', [
      { sourceStatsAvailable: true, sourceTotalAudioEnergy: 1 },
      { sourceStatsAvailable: true, sourceTotalAudioEnergy: 3 },
    ]);

    expect(sample).not.toHaveProperty('source_total_frames');
    expect(sample).not.toHaveProperty('source_total_frames_dropped');
    expect(sample).not.toHaveProperty('source_avg_fps');
    expect(sample).not.toHaveProperty('source_resolution');
  });

  test('reports capture energy even when the canceller reports no ERL/ERLE', () => {
    // echoCancellation: false — no canceller means no ERL/ERLE, but "was the mic live"
    // is exactly the question being asked of that cohort, so energy must survive.
    // These are cumulative counters: the first window reports the total since track start,
    // every later window reports the delta against the previous window's last stat.
    const analytics = makeAnalytics('audio');
    analytics.pushTempStat({ timestamp: 1000, sourceTotalAudioEnergy: 2, sourceTotalSamplesDuration: 10 } as TempStats);
    analytics.pushTempStat({ timestamp: 2000, sourceTotalAudioEnergy: 8, sourceTotalSamplesDuration: 40 } as TempStats);
    analytics.createSample();

    analytics.pushTempStat({
      timestamp: 3000,
      sourceTotalAudioEnergy: 15,
      sourceTotalSamplesDuration: 70,
    } as TempStats);
    analytics.createSample();

    const [first, second] = analytics.samples as LocalAudioSample[];
    expect(first.total_audio_energy).toBe(8);
    expect(first.total_samples_duration_sec).toBe(40);
    expect(second.total_audio_energy).toBe(7);
    expect(second.total_samples_duration_sec).toBe(30);
    expect(first.erle_db_min).toBeUndefined();
    expect(first.erle_distinct_count).toBeUndefined();
  });

  test('aggregates capture level as a range', () => {
    const sample = collate('audio', [{ sourceAudioLevel: 0.4 }, { sourceAudioLevel: 0.05 }, { sourceAudioLevel: 0.9 }]);

    expect(sample.audio_level_min).toBe(0.05);
    expect(sample.audio_level_max).toBe(0.9);
  });

  test('omits energy entirely when the browser never reported it, rather than sending 0', () => {
    // A missing counter must not be indistinguishable from measured silence.
    const sample = collate('audio', [{ sourceAudioLevel: 0.1 }, { sourceAudioLevel: 0.2 }]);

    expect(sample.total_audio_energy).toBeUndefined();
    expect(sample.total_samples_duration_sec).toBeUndefined();
  });

  test('separates a pinned canceller from an adapting one via erle_distinct_count', () => {
    const pinned = collate('audio', [
      { echoReturnLoss: -30, echoReturnLossEnhancement: 0.1755 },
      { echoReturnLoss: -30, echoReturnLossEnhancement: 0.1755 },
    ]);
    const adapting = collate('audio', [
      { echoReturnLoss: -12, echoReturnLossEnhancement: 4.2 },
      { echoReturnLoss: -18, echoReturnLossEnhancement: 11.6 },
    ]);

    expect(pinned.erle_distinct_count).toBe(1);
    expect(pinned.erl_db_min).toBe(-30);
    expect(pinned.erl_db_max).toBe(-30);

    expect(adapting.erle_distinct_count).toBe(2);
    expect(adapting.erle_db_min).toBe(4.2);
    expect(adapting.erle_db_max).toBe(11.6);
  });

  test('does not emit audio fields on video samples, and keeps frame counters there', () => {
    const sample = collate('video', [
      { sourceStatsAvailable: true, sourceFrames: 100, framesEncoded: 90 },
      { sourceStatsAvailable: true, sourceFrames: 400, framesEncoded: 360 },
    ]);

    expect(sample).not.toHaveProperty('audio_level_min');
    expect(sample).not.toHaveProperty('audio_level_max');
    expect(sample).not.toHaveProperty('total_audio_energy');
    expect(sample.source_total_frames).toBe(400);
  });
});
