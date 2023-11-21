import { HMSStatsStore } from '../../';
import { selectHMSStats } from '../../webrtc-stats';
import {
  localAudioTrackStats,
  localPeerStats,
  localVideoTrackStats,
  makeFakeInternalsStore,
  remoteAudioTrackStats,
  remoteVideoTrackStats,
} from '../fakeStore';

let fakeStore: HMSStatsStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeInternalsStore();
});

describe('local peer stats selectors', () => {
  test('selectPacketsLost', () => {
    expect(selectHMSStats.packetsLost(fakeStore)).toBe(localPeerStats.subscribe?.packetsLost);
  });

  test('selectJitter', () => {
    expect(selectHMSStats.jitter(fakeStore)).toBe(localPeerStats.subscribe?.jitter);
  });

  test('selectLocalPeerStats', () => {
    expect(selectHMSStats.localPeerStats(fakeStore)).toBe(localPeerStats);
  });

  test('selectPublishBitrate', () => {
    expect(selectHMSStats.publishBitrate(fakeStore)).toBe(localPeerStats.publish?.bitrate);
  });

  test('selectSubscribeBitrate', () => {
    expect(selectHMSStats.subscribeBitrate(fakeStore)).toBe(localPeerStats.subscribe?.bitrate);
  });

  test('selectAvailablePublishBitrate', () => {
    expect(selectHMSStats.availablePublishBitrate(fakeStore)).toBe(localPeerStats.publish?.availableOutgoingBitrate);
  });

  test('selectAvailableSubscribeBitrate', () => {
    expect(selectHMSStats.availableSubscribeBitrate(fakeStore)).toBe(
      localPeerStats.subscribe?.availableIncomingBitrate,
    );
  });

  test('selectTotalBytesSent', () => {
    expect(selectHMSStats.totalBytesSent(fakeStore)).toBe(localPeerStats.publish?.bytesSent);
  });

  test('selectTotalBytesReceived', () => {
    expect(selectHMSStats.totalBytesReceived(fakeStore)).toBe(localPeerStats.subscribe?.bytesReceived);
  });
});

describe('local tracks stats selectors', () => {
  test('selectLocalAudioTrackStats', () => {
    expect(selectHMSStats.localAudioTrackStatsByID('102')(fakeStore)).toBe(localAudioTrackStats);
  });

  test('selectLocalVideoTrackStats', () => {
    expect(selectHMSStats.localVideoTrackStatsByID('101')(fakeStore)?.[0]).toBe(localVideoTrackStats);
  });
});

describe('track stats by ID', () => {
  test('selectTrackStatsByID', () => {
    expect(selectHMSStats.trackStatsByID('103')(fakeStore)).toBe(remoteVideoTrackStats);
    expect(selectHMSStats.trackStatsByID('104')(fakeStore)).toBe(remoteAudioTrackStats);
  });
});
