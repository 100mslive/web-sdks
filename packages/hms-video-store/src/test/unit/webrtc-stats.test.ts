import {
  jitter,
  localAudioTrackStats,
  localPeerStats,
  localVideoTrackStats,
  makeFakeInternalsStore,
  packetsLost,
  remoteAudioTrackStats,
  remoteVideoTrackStats,
} from '../fakeStore';
import { HMSStatsStore, selectHMSStats } from '../../core';

let fakeStore: HMSStatsStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeInternalsStore();
});

describe('local peer stats selectors', () => {
  test('selectPacketsLost', () => {
    expect(selectHMSStats.packetsLost(fakeStore)).toBe(packetsLost);
  });

  test('selectJitter', () => {
    expect(selectHMSStats.jitter(fakeStore)).toBe(jitter);
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
    expect(selectHMSStats.localAudioTrackStats(fakeStore)).toBe(localAudioTrackStats);
  });

  test('selectLocalVideoTrackStats', () => {
    expect(selectHMSStats.localVideoTrackStats(fakeStore)).toBe(localVideoTrackStats);
  });

  test('selectLocalAudioTrackBitrate', () => {
    expect(selectHMSStats.localAudioTrackBitrate(fakeStore)).toBe(localAudioTrackStats.bitrate);
  });

  test('selectLocalVideoTrackBitrate', () => {
    expect(selectHMSStats.localVideoTrackBitrate(fakeStore)).toBe(localVideoTrackStats.bitrate);
  });

  test('selectLocalAudioTrackBytesSent', () => {
    expect(selectHMSStats.localAudioTrackBytesSent(fakeStore)).toBe(localAudioTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSStats.localVideoTrackBytesSent(fakeStore)).toBe(localVideoTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSStats.localVideoTrackFramerate(fakeStore)).toBe(localVideoTrackStats.framesPerSecond);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSStats.localVideoTrackQualityLimitationReason(fakeStore)).toBe(
      localVideoTrackStats.qualityLimitationReason,
    );
  });
});

describe('track stats by ID', () => {
  test('selectTrackStatsByID', () => {
    expect(selectHMSStats.trackStatsByID('103')(fakeStore)).toBe(remoteVideoTrackStats);
    expect(selectHMSStats.trackStatsByID('104')(fakeStore)).toBe(remoteAudioTrackStats);
  });

  test('selectBitrateByTrackID', () => {
    expect(selectHMSStats.bitrateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bitrate);
    expect(selectHMSStats.bitrateByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bitrate);
  });

  test('selectBytesReceivedByTrackID', () => {
    expect(selectHMSStats.bytesReceivedByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bytesReceived);

    expect(selectHMSStats.bytesReceivedByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bytesReceived);
  });

  test('selectJitterByTrackID', () => {
    expect(selectHMSStats.jitterByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.jitter);

    expect(selectHMSStats.jitterByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.jitter);
  });

  test('selectPacketsLostByTrackID', () => {
    expect(selectHMSStats.packetsLostByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.packetsLost);

    expect(selectHMSStats.packetsLostByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.packetsLost);
  });

  test('selectFramerateByTrackID', () => {
    expect(selectHMSStats.framerateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.framesPerSecond);
  });
});
