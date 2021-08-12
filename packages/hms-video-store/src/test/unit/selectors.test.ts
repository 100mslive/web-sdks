import {
  auxiliaryAudio,
  hostRole,
  localAudio,
  localPeer,
  localSpeaker,
  localVideo,
  makeFakeStore,
  peerScreenSharing,
  remoteVideo,
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
  selectVideoTrackByPeerID,
  selectAudioTrackByPeerID,
  selectTrackAudioByID,
  selectSimulcastLayerByTrack,
  selectDegradedTracks,
  selectPermissions,
  selectRoomState,
  HMSRoomState,
  selectIsInPreview,
  selectRoomStarted,
  selectMessagesByPeerID,
  selectMessagesByRole,
  selectBroadcastMessages,
  selectMessagesUnreadCountByRole,
  selectBroadcastMessagesUnreadCount,
  selectMessagesUnreadCountByPeerID,
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

  test('selectIsConnectedToRoom false', () => {
    fakeStore.room.isConnected = false;
    expect(selectIsConnectedToRoom(fakeStore)).toBe(false);
  });

  test('selectIsConnectedToRoom true', () => {
    fakeStore.room.isConnected = true;
    expect(selectIsConnectedToRoom(fakeStore)).toBe(true);
  });

  test('room state disconnected', () => {
    expect(selectRoomState(fakeStore)).toBe(HMSRoomState.Disconnected);
    expect(selectIsInPreview(fakeStore)).toBe(false);
    expect(selectRoomStarted(fakeStore)).toBe(false);
  });

  test('room state preview/connected', () => {
    fakeStore.room.roomState = HMSRoomState.Preview;
    expect(selectIsInPreview(fakeStore)).toBe(true);
    expect(selectRoomStarted(fakeStore)).toBe(true);
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
    expect(selectPermissions(fakeStore)?.muteSelective).toBe(hostRole.permissions.muteSelective);
    expect(selectPermissions(fakeStore)?.askToUnmute).toBe(hostRole.permissions.askToUnmute);
  });
});

describe('secondary selectors', () => {
  test('screenshare related', () => {
    expect(selectIsSomeoneScreenSharing(fakeStore)).toBe(true);
    expect(selectPeerScreenSharing(fakeStore)).toBe(peerScreenSharing);
    expect(selectPeersScreenSharing(fakeStore)).toEqual([peerScreenSharing]);
  });

  test('messages related', () => {
    expect(selectHMSMessagesCount(fakeStore)).toBe(3);
    expect(selectUnreadHMSMessagesCount(fakeStore)).toBe(1);
    expect(selectHMSMessages(fakeStore)).toEqual([
      fakeStore.messages.byID['201'],
      fakeStore.messages.byID['202'],
      fakeStore.messages.byID['203'],
    ]);
  });

  test('speakers', () => {
    expect(selectSpeakers(fakeStore)).toBe(fakeStore.speakers);
    fakeStore.speakers[peerScreenSharing.audioTrack!] = {
      audioLevel: 10,
      peerID: peerScreenSharing.id,
      trackID: peerScreenSharing.audioTrack!,
    };
    expect(selectDominantSpeaker(fakeStore)).toBe(localPeer);
  });

  test('remote peers', () => {
    expect(selectRemotePeers(fakeStore)).toEqual([peerScreenSharing]);
  });

  test('some track degraded', () => {
    remoteVideo.degraded = true;
    screenShare.degraded = true;
    expect(selectDegradedTracks(fakeStore)).toContain(remoteVideo);
    expect(selectDegradedTracks(fakeStore)).toContain(screenShare);
  });
});

describe('by ID selectors', () => {
  test('select peer by id', () => {
    expect(selectPeerByID(localPeer.id)(fakeStore)).toBe(localPeer);
    expect(selectPeerByID(peerScreenSharing.id)(fakeStore)).toBe(peerScreenSharing);
  });

  test('select peer AV enabled', () => {
    localAudio.enabled = false;
    localVideo.enabled = true;
    expect(selectIsPeerAudioEnabled(localPeer.id)(fakeStore)).toBe(false);
    expect(selectIsPeerVideoEnabled(localPeer.id)(fakeStore)).toBe(true);
  });

  test('selectVideoTrack', () => {
    expect(selectVideoTrackByPeerID(localPeer.id)(fakeStore)).toBe(localVideo);
    expect(selectCameraStreamByPeerID(localPeer.id)(fakeStore)).toBe(localVideo);
    expect(selectScreenShareByPeerID(peerScreenSharing.id)(fakeStore)).toBe(screenShare);
  });

  test('selectAudioTrack', () => {
    expect(selectAudioTrackByPeerID(localPeer.id)(fakeStore)).toBe(localAudio);
  });

  test('selectAuxiliaryAudio', () => {
    expect(selectAuxiliaryAudioByPeerID(peerScreenSharing.id)(fakeStore)).toBe(auxiliaryAudio);
  });

  test('selectScreenshareAudio', () => {
    expect(selectScreenShareAudioByPeerID(peerScreenSharing.id)(fakeStore)).toBe(screenshareAudio);
  });

  test('selectTrackAudioByID', () => {
    expect(selectTrackAudioByID(localAudio.id)(fakeStore)).toBe(localSpeaker.audioLevel);
  });

  test('selectPeerAudioByID', () => {
    expect(selectPeerAudioByID(localPeer.id)(fakeStore)).toBe(localSpeaker.audioLevel);
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

  test('selectSimulcastLayerByTrack', () => {
    const peer = selectRemotePeers(fakeStore);
    const track = selectVideoTrackByPeerID(peer[0].id)(fakeStore);
    expect(selectSimulcastLayerByTrack(track?.id)(fakeStore)).toBe(track?.layer);
  });

  test('selectMessagesByPeerID', () => {
    const peer = selectRemotePeers(fakeStore);
    const messages = selectMessagesByPeerID(peer[0].id)(fakeStore);
    expect(messages).toEqual([fakeStore.messages.byID['202']]);
  });

  test('selectMessagesByRole', () => {
    const peer = selectRemotePeers(fakeStore);
    const messages = selectMessagesByRole(peer[0].roleName)(fakeStore);
    expect(messages).toEqual([fakeStore.messages.byID['202'], fakeStore.messages.byID['203']]);
  });

  test('selectBroadcastMessages', () => {
    const messages = selectBroadcastMessages(fakeStore);
    expect(messages).toEqual([fakeStore.messages.byID['201']]);
  });

  test('selectMessagesUnreadCountByRole', () => {
    const peer = selectRemotePeers(fakeStore);
    const messages = selectMessagesUnreadCountByRole(peer[0].roleName)(fakeStore);
    expect(messages).toBe(1);
  });

  test('selectMessagesUnreadCountByPeerID', () => {
    const peer = selectRemotePeers(fakeStore);
    const messages = selectMessagesUnreadCountByPeerID(peer[0].id)(fakeStore);
    expect(messages).toBe(1);
  });

  test('selectBroadcastMessagesUnreadCount', () => {
    const messages = selectBroadcastMessagesUnreadCount(fakeStore);
    expect(messages).toBe(0);
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
