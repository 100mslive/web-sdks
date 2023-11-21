import {
  HMSRoomState,
  HMSStore,
  selectAppData,
  selectAudioPlaylist,
  selectAudioTrackByPeerID,
  selectAudioTrackVolume,
  selectAudioVolumeByPeerID,
  selectAuxiliaryAudioByPeerID,
  selectBroadcastMessages,
  selectBroadcastMessagesUnreadCount,
  selectCameraStreamByPeerID,
  selectConnectionQualities,
  selectDegradedTracks,
  selectDominantSpeaker,
  selectFullAppData,
  selectHMSMessages,
  selectHMSMessagesCount,
  selectIsAudioLocallyMuted,
  selectIsConnectedToRoom,
  selectIsInPreview,
  selectIsLocalAudioEnabled,
  selectIsLocallyMutedByPeerID,
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
  selectMessagesByPeerID,
  selectMessagesByRole,
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  selectPeerAudioByID,
  selectPeerByID,
  selectPeerMetadata,
  selectPeers,
  selectPeersByRole,
  selectPeerScreenSharing,
  selectPeersScreenSharing,
  selectPeersWithAudioStatus,
  selectPermissions,
  selectRemotePeers,
  selectRoom,
  selectRoomStarted,
  selectRoomState,
  selectScreenShareAudioByPeerID,
  selectScreenShareByPeerID,
  selectSimulcastLayerByTrack,
  selectSpeakers,
  selectTrackAudioByID,
  selectUnreadHMSMessagesCount,
  selectVideoPlaylist,
  selectVideoTrackByPeerID,
} from '../../';
import {
  auxiliaryAudio,
  hostRole,
  localAudio,
  localPeer,
  localSpeaker,
  localVideo,
  makeFakeStore,
  peerScreenSharing,
  playlist,
  remotePeerOne,
  remotePeerTwo,
  remoteVideo,
  screenShare,
  screenshareAudio,
} from '../fakeStore';

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
    expect(selectPermissions(fakeStore)?.mute).toBe(hostRole.permissions.mute);
    expect(selectPermissions(fakeStore)?.unmute).toBe(hostRole.permissions.unmute);
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

  test('connectionQualities', () => {
    expect(selectConnectionQualities(fakeStore)).toBe(fakeStore.connectionQualities);
  });

  test('remote peers', () => {
    expect(selectRemotePeers(fakeStore)).toEqual([remotePeerOne, remotePeerTwo]);
  });

  test('some track degraded', () => {
    remoteVideo.degraded = true;
    screenShare.degraded = true;
    expect(selectDegradedTracks(fakeStore)).toContain(remoteVideo);
    expect(selectDegradedTracks(fakeStore)).toContain(screenShare);
  });

  test('audio playlist related', () => {
    const list = Object.values(playlist.audio.list);
    expect(selectAudioPlaylist.list(fakeStore)).toEqual(list);
    expect(selectAudioPlaylist.progress(fakeStore)).toBe(20);
    expect(selectAudioPlaylist.currentTime(fakeStore)).toBe(10);
    expect(selectAudioPlaylist.playbackRate(fakeStore)).toBe(0.5);
    expect(selectAudioPlaylist.selection(fakeStore)).toEqual({
      id: list[0].id,
      hasNext: true,
      hasPrevious: false,
    });
    expect(selectAudioPlaylist.selectedItem(fakeStore)).toEqual(list[0]);
  });

  test('video playlist related', () => {
    const list = Object.values(playlist.video.list);
    expect(selectVideoPlaylist.list(fakeStore)).toEqual(list);
    expect(selectVideoPlaylist.progress(fakeStore)).toBe(30);
    expect(selectVideoPlaylist.currentTime(fakeStore)).toBe(20);
    expect(selectVideoPlaylist.playbackRate(fakeStore)).toBe(1.0);
    expect(selectVideoPlaylist.selection(fakeStore)).toEqual({
      id: list[0].id,
      hasNext: true,
      hasPrevious: false,
    });
    expect(selectVideoPlaylist.selectedItem(fakeStore)).toEqual(list[0]);
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
    expect(messages).toEqual([fakeStore.messages.byID['203']]);
  });

  test('selectBroadcastMessages', () => {
    const messages = selectBroadcastMessages(fakeStore);
    expect(messages).toEqual([fakeStore.messages.byID['201']]);
  });

  test('selectMessagesUnreadCountByRole', () => {
    const peer = selectRemotePeers(fakeStore);
    const messages = selectMessagesUnreadCountByRole(peer[0].roleName)(fakeStore);
    expect(messages).toBe(0);
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

  test('selectPeersByRole', () => {
    expect(selectPeersByRole('speaker')(fakeStore)).toEqual([remotePeerTwo]);
    // If role is not present
    expect(selectPeersByRole('incognito')(fakeStore)).toEqual([]);
  });

  test('selectPeerMetadata', () => {
    const peers = selectPeers(fakeStore);
    const metadata1 = selectPeerMetadata(peers[0].id)(fakeStore);
    expect(metadata1).toEqual({});
    const metadata2 = selectPeerMetadata(peers[1].id)(fakeStore);
    expect(metadata2).toEqual({ hello: 'world' });
  });
});

describe('derived selectors', () => {
  test('select peer with audio status', () => {
    localAudio.enabled = true;
    expect(selectPeersWithAudioStatus(fakeStore)).toEqual([
      { peer: localPeer, isAudioEnabled: true },
      { peer: peerScreenSharing, isAudioEnabled: false },
      { peer: remotePeerTwo, isAudioEnabled: false },
    ]);
  });
});

describe('appData', () => {
  test('select AppData', () => {
    expect(selectFullAppData(fakeStore)).toEqual(fakeStore.appData);
  });
  test('select AppDataByKey', () => {
    expect(selectAppData('isAudioOnly')(fakeStore)).toEqual(true);
  });
});
