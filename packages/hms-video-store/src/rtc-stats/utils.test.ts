import { getLocalPeerStatsFromReport } from './utils';
import { HMSPeerStats } from '../interfaces';

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
