import {
  auxiliaryAudio,
  localAudio,
  localPeer,
  localSpeaker,
  localVideo,
  makeFakeStore,
  peerScreenSharing,
  screenShare,
  screenshareAudio,
} from '../fakeStore';
import {
  HMSStore,
  selectCameraStreamByPeerID,
  selectDominantSpeaker,
  selectHMSMessages,
  selectHMSMessagesCount,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalScreenShared,
  selectIsLocalVideoDisplayEnabled,
  selectIsLocalVideoEnabled,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectIsSomeoneScreenSharing,
  selectLocalAudioTrackID,
  selectLocalMediaSettings,
  selectLocalPeer,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectMaxTilesCount,
  selectPeerAudioByID,
  selectPeerByID,
  selectPeerScreenSharing,
  selectPeersScreenSharing,
  selectPeersWithAudioStatus,
  selectRemotePeers,
  selectRoom,
  selectAuxiliaryAudioByPeerID,
  selectScreenShareByPeerID,
  selectSpeakers,
  selectUnreadHMSMessagesCount,
  selectScreenShareAudioByPeerID,
  selectAudioVolumeByPeerID,
  selectAudioTrackVolume,
  selectIsLocallyMutedByPeerID,
  selectIsAudioLocallyMuted,
} from '../../core';

let fakeStore: HMSStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeStore();
});

describe('test primitive selectors', () => {
  test('selectRoom', () => {
    expect(selectRoom(fakeStore)).toBe(fakeStore.room);
  });

  test('selectMaxTilesCount', () => {
    expect(selectMaxTilesCount(fakeStore)).toBe(fakeStore.settings.maxTileCount);
  });

  test('selectIsConnectedToRoom false', () => {
    fakeStore.room.isConnected = false;
    expect(selectIsConnectedToRoom(fakeStore)).toBe(false);
  });

  test('selectIsConnectedToRoom true', () => {
    fakeStore.room.isConnected = true;
    expect(selectIsConnectedToRoom(fakeStore)).toBe(true);
  });

  test('selectLocal things', () => {
    expect(selectLocalMediaSettings(fakeStore)).toBe(fakeStore.settings);
    expect(selectLocalPeer(fakeStore)).toBe(localPeer);
    expect(selectLocalPeerID(fakeStore)).toBe(localPeer.id);
    expect(selectLocalVideoTrackID(fakeStore)).toBe(localPeer.videoTrack);
    expect(selectLocalAudioTrackID(fakeStore)).toBe(localPeer.audioTrack);
    localAudio.enabled = true;
    expect(selectIsLocalAudioEnabled(fakeStore)).toBe(true);
    localAudio.enabled = false;
    expect(selectIsLocalAudioEnabled(fakeStore)).toBe(false);
    localVideo.enabled = true;
    expect(selectIsLocalVideoEnabled(fakeStore)).toBe(true);
    localVideo.enabled = false;
    expect(selectIsLocalVideoEnabled(fakeStore)).toBe(false);
    expect(selectIsLocalScreenShared(fakeStore)).toBe(false);
    localVideo.displayEnabled = true;
    expect(selectIsLocalVideoDisplayEnabled(fakeStore)).toBe(true);
  });
});

describe('secondary selectors', () => {
  test('screenshare related', () => {
    expect(selectIsSomeoneScreenSharing(fakeStore)).toBe(true);
    expect(selectPeerScreenSharing(fakeStore)).toBe(peerScreenSharing);
    expect(selectPeersScreenSharing(fakeStore)).toEqual([peerScreenSharing]);
  });

  test('messages related', () => {
    expect(selectHMSMessagesCount(fakeStore)).toBe(2);
    expect(selectUnreadHMSMessagesCount(fakeStore)).toBe(1);
    expect(selectHMSMessages(fakeStore)).toEqual([
      fakeStore.messages.byID['201'],
      fakeStore.messages.byID['202'],
    ]);
  });

  test('speakers', () => {
    expect(selectSpeakers(fakeStore)).toBe(fakeStore.speakers);
    fakeStore.speakers[peerScreenSharing.id] = { audioLevel: 10 };
    expect(selectDominantSpeaker(fakeStore)).toBe(localPeer);
  });

  test('remote peers', () => {
    expect(selectRemotePeers(fakeStore)).toEqual([peerScreenSharing]);
  });
});

describe('by ID selectors', () => {
  test('select peer by id', () => {
    expect(selectPeerByID(localPeer.id)(fakeStore)).toBe(localPeer);
    expect(selectPeerByID(peerScreenSharing.id)(fakeStore)).toBe(peerScreenSharing);
  });

  test('select peer by id', () => {
    localAudio.enabled = false;
    localVideo.enabled = true;
    expect(selectIsPeerAudioEnabled(localPeer.id)(fakeStore)).toBe(false);
    expect(selectIsPeerVideoEnabled(localPeer.id)(fakeStore)).toBe(true);
  });

  test('selectPeerAudioByID', () => {
    expect(selectPeerAudioByID(localPeer.id)(fakeStore)).toBe(localSpeaker.audioLevel);
  });

  test('selectVideoStream', () => {
    expect(selectCameraStreamByPeerID(localPeer.id)(fakeStore)).toBe(localVideo);
    expect(selectScreenShareByPeerID(peerScreenSharing.id)(fakeStore)).toBe(screenShare);
  });

  test('selectAuxiliaryAudio', () => {
    expect(selectAuxiliaryAudioByPeerID(peerScreenSharing.id)(fakeStore)).toBe(auxiliaryAudio);
  });

  test('selectScreenshareAudio', () => {
    expect(selectScreenShareAudioByPeerID(peerScreenSharing.id)(fakeStore)).toBe(screenshareAudio);
  });

  test('selectAudioVolumeByPeerID', () => {
    expect(selectAudioVolumeByPeerID(localPeer.id)(fakeStore)).toBe(localAudio.volume);
  });

  test('selectAudioVolumeByTrackID', () => {
    expect(selectAudioTrackVolume(localPeer.audioTrack)(fakeStore)).toBe(localAudio.volume);
  });
  test('selectLocallyMutedByPeerID', () => {
    expect(selectIsLocallyMutedByPeerID(localPeer.id)(fakeStore)).toBe(false);
  });
  test('selectLocallyMutedByTrackID', () => {
    expect(selectIsAudioLocallyMuted(localPeer.audioTrack)(fakeStore)).toBe(false);
  });
});

describe('derived selectors', () => {
  test('select peer with audio status', () => {
    localAudio.enabled = true;
    expect(selectPeersWithAudioStatus(fakeStore)).toEqual([
      { peer: localPeer, isAudioEnabled: true },
      { peer: peerScreenSharing, isAudioEnabled: false },
    ]);
  });
});
