import { getConnectionType, getLocalPeerStatsFromReport, getTrackStats } from './utils';
import { EventBus } from '../events/EventBus';
import { HMSIceCandidateStats, HMSPeerStats } from '../interfaces';
import { HMSRemoteTrack } from '../media/tracks';

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

const localCandidate = (extra: Partial<StatEntry> = {}): StatEntry => ({
  id: 'LC1',
  type: 'local-candidate',
  ...extra,
});

const remoteCandidate = (extra: Partial<StatEntry> = {}): StatEntry => ({
  id: 'RC1',
  type: 'remote-candidate',
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

describe('getLocalPeerStatsFromReport — ICE candidates', () => {
  test('resolves the active pair`s local and remote candidates from the same report', () => {
    const report = makeReport([
      transport('CP1'),
      candidatePair(0, 1_000, { localCandidateId: 'LC1', remoteCandidateId: 'RC1' }),
      localCandidate({ candidateType: 'srflx', protocol: 'udp', address: '223.181.114.100', port: 14154 }),
      remoteCandidate({ candidateType: 'srflx', protocol: 'udp', address: '35.200.223.203', port: 29080 }),
    ]);

    const stats = getLocalPeerStatsFromReport('publish', report, undefined);

    expect(stats!.localCandidate).toMatchObject({ candidateType: 'srflx', protocol: 'udp', port: 14154 });
    expect(stats!.remoteCandidate).toMatchObject({ candidateType: 'srflx', address: '35.200.223.203' });
  });

  test('leaves candidates undefined when the report has no matching entries (Firefox)', () => {
    const report = makeReport([transport('CP1'), candidatePair(0, 1_000)]);

    const stats = getLocalPeerStatsFromReport('subscribe', report, undefined);

    expect(stats!.localCandidate).toBeUndefined();
    expect(stats!.remoteCandidate).toBeUndefined();
  });

  /**
   * `getActiveCandidatePairFromReport` hands back the report's own candidate-pair entry, and
   * everything downstream used to `Object.assign` onto it - which mutates the target, it does not
   * clone. So the browser's entry picked up `localCandidate`, `remoteCandidate` and `bitrate`, and
   * the two candidate objects rode into the reactive store to be deep-frozen by immer. Cloning once
   * at the head of the chain is what keeps the whole chain off the report.
   */
  test('does not write anything back onto the report it read from', () => {
    const report = makeReport([
      transport('CP1'),
      candidatePair(0, 1_000, { localCandidateId: 'LC1', remoteCandidateId: 'RC1' }),
      localCandidate({ candidateType: 'srflx', protocol: 'udp', address: '223.181.114.100', port: 14154 }),
      remoteCandidate({ candidateType: 'srflx', protocol: 'udp', address: '35.200.223.203', port: 29080 }),
    ]);
    const keysBefore = Object.keys(report.get('CP1')).sort();

    const stats = getLocalPeerStatsFromReport('publish', report, undefined);

    expect(Object.keys(report.get('CP1')).sort()).toEqual(keysBefore);
    // and the caller still gets everything it asked for, on its own object
    expect(stats).toMatchObject({ localCandidate: { id: 'LC1' }, remoteCandidate: { id: 'RC1' } });
    expect(stats).toHaveProperty('bitrate');
  });
});

describe('getConnectionType', () => {
  test.each([
    ['host', undefined, 'host'],
    ['srflx', undefined, 'srflx'],
    ['prflx', undefined, 'prflx'],
    ['relay', 'udp', 'relay(udp)'],
    ['relay', 'tcp', 'relay(tcp)'],
    ['relay', 'tls', 'relay(tls)'],
    // A relayed path can surface as a peer-reflexive candidate when the address was learnt
    // over the relay — `relayProtocol` is what gives it away, so it must win over candidateType.
    ['prflx', 'udp', 'relay(udp)'],
  ])('candidateType %s with relayProtocol %s => %s', (candidateType, relayProtocol, expected) => {
    const localCandidate = { candidateType, relayProtocol } as HMSIceCandidateStats;

    expect(getConnectionType({ localCandidate })).toBe(expected);
  });

  test('is undefined when the candidate is missing', () => {
    expect(getConnectionType(undefined)).toBeUndefined();
    expect(getConnectionType({})).toBeUndefined();
  });
});

/**
 * getRelevantStatsFromTrackReport reads inbound-rtp / remote-inbound-rtp straight off the report,
 * so assigning onto what it returns writes into the browser's own entries - the same defect as the
 * candidate pair, one level down and on every stats poll for every remote track.
 */
describe('getTrackStats — report ownership', () => {
  const inboundRtp = (extra: Partial<StatEntry> = {}): StatEntry => ({
    id: 'IN1',
    type: 'inbound-rtp',
    ssrc: 1,
    bytesReceived: 1000,
    packetsLost: 2,
    timestamp: 1_000,
    ...extra,
  });
  const remoteInboundRtp = (extra: Partial<StatEntry> = {}): StatEntry => ({
    id: 'RIN1',
    type: 'remote-inbound-rtp',
    ssrc: 1,
    packetsLost: 3,
    timestamp: 1_000,
    ...extra,
  });

  test('does not write derived fields onto the report entries it read from', async () => {
    const report = makeReport([inboundRtp(), remoteInboundRtp()]);
    const inboundKeysBefore = Object.keys(report.get('IN1')).sort();
    const remoteKeysBefore = Object.keys(report.get('RIN1')).sort();
    const track = {
      trackId: 'track-1',
      peerId: 'peer-1',
      enabled: true,
      transceiver: { receiver: { getStats: async () => report, track: { id: 'native-1' } } },
    } as unknown as HMSRemoteTrack;

    const stats = await getTrackStats({ analytics: { publish: jest.fn() } } as unknown as EventBus, track);

    expect(Object.keys(report.get('IN1')).sort()).toEqual(inboundKeysBefore);
    expect(Object.keys(report.get('RIN1')).sort()).toEqual(remoteKeysBefore);
    expect(stats?.remote).not.toBe(report.get('RIN1'));
    expect(stats).toHaveProperty('bitrate');
  });
});
