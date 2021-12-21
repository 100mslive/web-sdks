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
import { HMSInternalsStore, selectHMSInternals } from '../../core';

let fakeStore: HMSInternalsStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeInternalsStore();
});

describe('local peer stats selectors', () => {
  test('selectPacketsLost', () => {
    expect(selectHMSInternals.packetsLost(fakeStore)).toBe(packetsLost);
  });

  test('selectJitter', () => {
    expect(selectHMSInternals.jitter(fakeStore)).toBe(jitter);
  });

  test('selectLocalPeerStats', () => {
    expect(selectHMSInternals.localPeerStats(fakeStore)).toBe(localPeerStats);
  });

  test('selectPublishBitrate', () => {
    expect(selectHMSInternals.publishBitrate(fakeStore)).toBe(localPeerStats.publish?.bitrate);
  });

  test('selectSubscribeBitrate', () => {
    expect(selectHMSInternals.subscribeBitrate(fakeStore)).toBe(localPeerStats.subscribe?.bitrate);
  });

  test('selectAvailablePublishBitrate', () => {
    expect(selectHMSInternals.availablePublishBitrate(fakeStore)).toBe(
      localPeerStats.publish?.availableOutgoingBitrate,
    );
  });

  test('selectAvailableSubscribeBitrate', () => {
    expect(selectHMSInternals.availableSubscribeBitrate(fakeStore)).toBe(
      localPeerStats.subscribe?.availableIncomingBitrate,
    );
  });

  test('selectTotalBytesSent', () => {
    expect(selectHMSInternals.totalBytesSent(fakeStore)).toBe(localPeerStats.publish?.bytesSent);
  });

  test('selectTotalBytesReceived', () => {
    expect(selectHMSInternals.totalBytesReceived(fakeStore)).toBe(localPeerStats.subscribe?.bytesReceived);
  });
});

describe('local tracks stats selectors', () => {
  test('selectLocalAudioTrackStats', () => {
    expect(selectHMSInternals.localAudioTrackStats(fakeStore)).toBe(localAudioTrackStats);
  });

  test('selectLocalVideoTrackStats', () => {
    expect(selectHMSInternals.localVideoTrackStats(fakeStore)).toBe(localVideoTrackStats);
  });

  test('selectLocalAudioTrackBitrate', () => {
    expect(selectHMSInternals.localAudioTrackBitrate(fakeStore)).toBe(localAudioTrackStats.bitrate);
  });

  test('selectLocalVideoTrackBitrate', () => {
    expect(selectHMSInternals.localVideoTrackBitrate(fakeStore)).toBe(localVideoTrackStats.bitrate);
  });

  test('selectLocalAudioTrackBytesSent', () => {
    expect(selectHMSInternals.localAudioTrackBytesSent(fakeStore)).toBe(localAudioTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSInternals.localVideoTrackBytesSent(fakeStore)).toBe(localVideoTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSInternals.localVideoTrackFramerate(fakeStore)).toBe(localVideoTrackStats.framesPerSecond);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectHMSInternals.localVideoTrackQualityLimitationReason(fakeStore)).toBe(
      localVideoTrackStats.qualityLimitationReason,
    );
  });
});

describe('track stats by ID', () => {
  test('selectTrackStatsByID', () => {
    expect(selectHMSInternals.trackStatsByID('103')(fakeStore)).toBe(remoteVideoTrackStats);
    expect(selectHMSInternals.trackStatsByID('104')(fakeStore)).toBe(remoteAudioTrackStats);
  });

  test('selectBitrateByTrackID', () => {
    expect(selectHMSInternals.bitrateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bitrate);
    expect(selectHMSInternals.bitrateByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bitrate);
  });

  test('selectBytesReceivedByTrackID', () => {
    expect(selectHMSInternals.bytesReceivedByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bytesReceived);

    expect(selectHMSInternals.bytesReceivedByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bytesReceived);
  });

  test('selectJitterByTrackID', () => {
    expect(selectHMSInternals.jitterByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.jitter);

    expect(selectHMSInternals.jitterByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.jitter);
  });

  test('selectPacketsLostByTrackID', () => {
    expect(selectHMSInternals.packetsLostByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.packetsLost);

    expect(selectHMSInternals.packetsLostByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.packetsLost);
  });

  test('selectFramerateByTrackID', () => {
    expect(selectHMSInternals.framerateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.framesPerSecond);
  });
});
