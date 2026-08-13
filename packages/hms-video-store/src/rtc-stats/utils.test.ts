import { getLocalPeerStatsFromReport, getLocalTrackStats } from './utils';
import { EventBus } from '../events/EventBus';
import { HMSPeerStats } from '../interfaces';
import { HMSLocalTrack, HMSTrackType } from '../media/tracks';

type StatEntry = Record<string, any>;

// Minimal RTCStatsReport-like fake: iterable via `forEach` and lookup-able via `get`, which is
// all the SUT uses. We avoid depending on a real RTCStatsReport (not available in jsdom).
const makeReport = (entries: StatEntry[]): RTCStatsReport => {
  const map = new Map<string, StatEntry>(entries.map(e => [e.id as string, e]));
  return map as unknown as RTCStatsReport;
};

const transport = (selectedCandidatePairId: string): StatEntry => ({
  id: 'T1',
  type: 'transport',
  selectedCandidatePairId,
});

const candidatePair = (bytesSent: number, timestamp: number, extra: Partial<StatEntry> = {}): StatEntry => ({
  id: 'CP1',
  type: 'candidate-pair',
  selected: true,
  bytesSent,
  bytesReceived: 0,
  timestamp,
  availableOutgoingBitrate: 1_000_000,
  ...extra,
});

const outboundRtp = (bytesSent: number, timestamp: number, id = 'O1'): StatEntry => ({
  id,
  type: 'outbound-rtp',
  bytesSent,
  timestamp,
});

describe('getLocalPeerStatsFromReport — publish bitrate (LIV-243)', () => {
  test('returns bitrate 0 when nothing is being published, even if candidate-pair bytesSent is large (BWE probing)', () => {
    // Candidate-pair bytesSent jumps by 125_000 B/s (= 1 Mbps of phantom probing),
    // but no outbound-rtp streams exist — bitrate must be 0.
    const t0 = 1_000_000;
    const t1 = t0 + 1000; // 1s later

    const prevReport = makeReport([transport('CP1'), candidatePair(0, t0)]);
    const prevStats = getLocalPeerStatsFromReport('publish', prevReport, undefined);

    const nextReport = makeReport([transport('CP1'), candidatePair(125_000, t1)]);
    const nextStats = getLocalPeerStatsFromReport('publish', nextReport, {
      publish: prevStats,
    } as HMSPeerStats);

    expect(nextStats).toBeDefined();
    expect(nextStats!.bitrate).toBe(0);
    // Transport-level bytes are still reported on the pair so "Total Bytes Sent" stays correct.
    expect(nextStats!.bytesSent).toBe(125_000);
  });

  test('returns bitrate derived from outbound-rtp bytesSent delta when publishing real media', () => {
    const t0 = 2_000_000;
    const t1 = t0 + 1000; // 1s later
    // 1 Mbps of actual media = 125_000 bytes/s on outbound-rtp
    const prevReport = makeReport([transport('CP1'), candidatePair(200_000, t0), outboundRtp(0, t0)]);
    const prevStats = getLocalPeerStatsFromReport('publish', prevReport, undefined);

    const nextReport = makeReport([transport('CP1'), candidatePair(350_000, t1), outboundRtp(125_000, t1)]);
    const nextStats = getLocalPeerStatsFromReport('publish', nextReport, {
      publish: prevStats,
    } as HMSPeerStats);

    expect(nextStats).toBeDefined();
    // 125_000 bytes/s over 1s → 1 Mbps
    expect(nextStats!.bitrate).toBe(1_000_000);
  });

  test('sums bytesSent across simulcast layers', () => {
    const t0 = 3_000_000;
    const t1 = t0 + 1000;
    const prevReport = makeReport([
      transport('CP1'),
      candidatePair(100_000, t0),
      outboundRtp(0, t0, 'O-high'),
      outboundRtp(0, t0, 'O-mid'),
      outboundRtp(0, t0, 'O-low'),
    ]);
    const prevStats = getLocalPeerStatsFromReport('publish', prevReport, undefined);

    const nextReport = makeReport([
      transport('CP1'),
      candidatePair(300_000, t1),
      outboundRtp(80_000, t1, 'O-high'),
      outboundRtp(30_000, t1, 'O-mid'),
      outboundRtp(15_000, t1, 'O-low'),
    ]);
    const nextStats = getLocalPeerStatsFromReport('publish', nextReport, {
      publish: prevStats,
    } as HMSPeerStats);

    // (80k + 30k + 15k) = 125k bytes/s = 1 Mbps
    expect(nextStats!.bitrate).toBe(1_000_000);
  });

  test('first sample (no prev) reports bitrate 0 rather than extrapolating from zero baseline', () => {
    const report = makeReport([transport('CP1'), candidatePair(500_000, 4_000_000), outboundRtp(250_000, 4_000_000)]);
    const stats = getLocalPeerStatsFromReport('publish', report, undefined);
    expect(stats).toBeDefined();
    expect(stats!.bitrate).toBe(0);
    expect(stats!.outboundRtpBytesSent).toBe(250_000);
  });
});

describe('getLocalPeerStatsFromReport — subscribe bitrate', () => {
  test('subscribe bitrate still comes from candidate-pair bytesReceived delta (unchanged behavior)', () => {
    const t0 = 5_000_000;
    const t1 = t0 + 1000;
    const prevReport = makeReport([transport('CP1'), { ...candidatePair(0, t0), bytesReceived: 0 }]);
    const prevStats = getLocalPeerStatsFromReport('subscribe', prevReport, undefined);

    const nextReport = makeReport([transport('CP1'), { ...candidatePair(0, t1), bytesReceived: 125_000 }]);
    const nextStats = getLocalPeerStatsFromReport('subscribe', nextReport, {
      subscribe: prevStats,
    } as HMSPeerStats);

    expect(nextStats).toBeDefined();
    expect(nextStats!.bitrate).toBe(1_000_000);
  });
});

const audioMediaSource = (extra: Partial<StatEntry> = {}): StatEntry => ({
  id: 'SA1',
  type: 'media-source',
  kind: 'audio',
  trackIdentifier: 'sender-track-1',
  audioLevel: 0.05,
  totalAudioEnergy: 12.5,
  totalSamplesDuration: 60,
  echoReturnLoss: -29.08,
  echoReturnLossEnhancement: 0.1755,
  ...extra,
});

const audioTrack = (report: RTCStatsReport, type = HMSTrackType.AUDIO) =>
  ({
    type,
    trackId: 'track-1',
    peerId: 'peer-1',
    enabled: true,
    transceiver: { sender: { track: { id: 'sender-track-1' }, getStats: async () => report } },
  } as unknown as HMSLocalTrack);

const eventBus = { analytics: { publish: jest.fn() } } as unknown as EventBus;

describe('getLocalTrackStats — audio echo-cancellation stats', () => {
  test('surfaces ERL/ERLE and cumulative energy from the audio media-source stat', async () => {
    const report = makeReport([outboundRtp(1000, 5_000_000), audioMediaSource()]);

    const stats = await getLocalTrackStats(eventBus, audioTrack(report));

    expect(stats?.O1.echoReturnLoss).toBe(-29.08);
    expect(stats?.O1.echoReturnLossEnhancement).toBe(0.1755);
    expect(stats?.O1.sourceTotalAudioEnergy).toBe(12.5);
    expect(stats?.O1.sourceTotalSamplesDuration).toBe(60);
    expect(stats?.O1.sourceAudioLevel).toBe(0.05);
    // sourceStatsAvailable gates the video frame counters; audio must not set it, otherwise
    // getSourceStats ships source_total_frames: 0 on every audio sample.
    expect(stats?.O1.sourceStatsAvailable).toBeUndefined();
  });

  test('reads a media-source that reports mediaType instead of kind', async () => {
    const stat = audioMediaSource();
    delete (stat as Record<string, unknown>).kind;
    (stat as Record<string, unknown>).mediaType = 'audio';
    const report = makeReport([outboundRtp(1000, 5_000_000), stat]);

    const stats = await getLocalTrackStats(eventBus, audioTrack(report));

    expect(stats?.O1.echoReturnLossEnhancement).toBe(0.1755);
  });

  test('ignores a media-source belonging to a different sender track', async () => {
    const report = makeReport([outboundRtp(1000, 5_000_000), audioMediaSource({ trackIdentifier: 'someone-else' })]);

    const stats = await getLocalTrackStats(eventBus, audioTrack(report));

    expect(stats?.O1.echoReturnLossEnhancement).toBeUndefined();
    expect(stats?.O1.sourceAudioLevel).toBeUndefined();
  });

  test('leaves echo fields unset when the browser reports no audio media-source', async () => {
    const report = makeReport([outboundRtp(1000, 5_000_000)]);

    const stats = await getLocalTrackStats(eventBus, audioTrack(report));

    expect(stats?.O1.echoReturnLoss).toBeUndefined();
    expect(stats?.O1.echoReturnLossEnhancement).toBeUndefined();
  });
});
