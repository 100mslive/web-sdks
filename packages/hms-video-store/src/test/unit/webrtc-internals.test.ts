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
import {
  HMSInternalsStore,
  selectAvailablePublishBitrate,
  selectAvailableSubscribeBitrate,
  selectBitrateByTrackID,
  selectBytesReceivedByTrackID,
  selectFramerateByTrackID,
  selectJitter,
  selectJitterByTrackID,
  selectLocalAudioTrackBitrate,
  selectLocalAudioTrackBytesSent,
  selectLocalAudioTrackStats,
  selectLocalPeerStats,
  selectLocalVideoTrackBitrate,
  selectLocalVideoTrackBytesSent,
  selectLocalVideoTrackFramerate,
  selectLocalVideoTrackQualityLimitationReason,
  selectLocalVideoTrackStats,
  selectPacketsLost,
  selectPacketsLostByTrackID,
  selectPublishBitrate,
  selectSubscribeBitrate,
  selectTotalBytesReceived,
  selectTotalBytesSent,
  selectTrackStatsByID,
} from '../../core';

let fakeStore: HMSInternalsStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeInternalsStore();
});

describe('local peer stats selectors', () => {
  test('selectPacketsLost', () => {
    expect(selectPacketsLost(fakeStore)).toBe(packetsLost);
  });

  test('selectJitter', () => {
    expect(selectJitter(fakeStore)).toBe(jitter);
  });

  test('selectLocalPeerStats', () => {
    expect(selectLocalPeerStats(fakeStore)).toBe(localPeerStats);
  });

  test('selectPublishBitrate', () => {
    expect(selectPublishBitrate(fakeStore)).toBe(localPeerStats.publish?.bitrate);
  });

  test('selectSubscribeBitrate', () => {
    expect(selectSubscribeBitrate(fakeStore)).toBe(localPeerStats.subscribe?.bitrate);
  });

  test('selectAvailablePublishBitrate', () => {
    expect(selectAvailablePublishBitrate(fakeStore)).toBe(localPeerStats.publish?.availableOutgoingBitrate);
  });

  test('selectAvailableSubscribeBitrate', () => {
    expect(selectAvailableSubscribeBitrate(fakeStore)).toBe(localPeerStats.subscribe?.availableIncomingBitrate);
  });

  test('selectTotalBytesSent', () => {
    expect(selectTotalBytesSent(fakeStore)).toBe(localPeerStats.publish?.bytesSent);
  });

  test('selectTotalBytesReceived', () => {
    expect(selectTotalBytesReceived(fakeStore)).toBe(localPeerStats.subscribe?.bytesReceived);
  });
});

describe('local tracks stats selectors', () => {
  test('selectLocalAudioTrackStats', () => {
    expect(selectLocalAudioTrackStats(fakeStore)).toBe(localAudioTrackStats);
  });

  test('selectLocalVideoTrackStats', () => {
    expect(selectLocalVideoTrackStats(fakeStore)).toBe(localVideoTrackStats);
  });

  test('selectLocalAudioTrackBitrate', () => {
    expect(selectLocalAudioTrackBitrate(fakeStore)).toBe(localAudioTrackStats.bitrate);
  });

  test('selectLocalVideoTrackBitrate', () => {
    expect(selectLocalVideoTrackBitrate(fakeStore)).toBe(localVideoTrackStats.bitrate);
  });

  test('selectLocalAudioTrackBytesSent', () => {
    expect(selectLocalAudioTrackBytesSent(fakeStore)).toBe(localAudioTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectLocalVideoTrackBytesSent(fakeStore)).toBe(localVideoTrackStats.bytesSent);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectLocalVideoTrackFramerate(fakeStore)).toBe(localVideoTrackStats.framesPerSecond);
  });

  test('selectLocalVideoTrackBytesSent', () => {
    expect(selectLocalVideoTrackQualityLimitationReason(fakeStore)).toBe(localVideoTrackStats.qualityLimitationReason);
  });
});

describe('track stats by ID', () => {
  test('selectTrackStatsByID', () => {
    expect(selectTrackStatsByID('103')(fakeStore)).toBe(remoteVideoTrackStats);
    expect(selectTrackStatsByID('104')(fakeStore)).toBe(remoteAudioTrackStats);
  });

  test('selectBitrateByTrackID', () => {
    expect(selectBitrateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bitrate);
    expect(selectBitrateByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bitrate);
  });

  test('selectBytesReceivedByTrackID', () => {
    expect(selectBytesReceivedByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.bytesReceived);

    expect(selectBytesReceivedByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.bytesReceived);
  });

  test('selectJitterByTrackID', () => {
    expect(selectJitterByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.jitter);

    expect(selectJitterByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.jitter);
  });

  test('selectPacketsLostByTrackID', () => {
    expect(selectPacketsLostByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.packetsLost);

    expect(selectPacketsLostByTrackID('104')(fakeStore)).toBe(remoteAudioTrackStats.packetsLost);
  });

  test('selectFramerateByTrackID', () => {
    expect(selectFramerateByTrackID('103')(fakeStore)).toBe(remoteVideoTrackStats.framesPerSecond);
  });
});
