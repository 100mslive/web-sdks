import {
  HMSMessageType,
  HMSPeer,
  HMSRoomState,
  HMSSpeaker,
  HMSStore,
  HMSTrack,
  HMSTrackID,
  HMSTrackSource,
  HMSTrackType,
} from '../core';
import { HMSSimulcastLayer } from '../core/hmsSDKStore/sdkTypes';

function makeTrack(
  id: HMSTrackID,
  type: HMSTrackType,
  source: HMSTrackSource,
  enabled?: boolean,
): HMSTrack {
  return {
    id: id,
    source: source,
    type: type,
    enabled: !!enabled,
    displayEnabled: true,
    volume: type === 'audio' ? 10 : undefined,
    layer: type === 'video' ? HMSSimulcastLayer.HIGH : undefined,
  };
}

export let localPeer: HMSPeer;
export let peerScreenSharing: HMSPeer;
export let localVideo: HMSTrack;
export let localAudio: HMSTrack;
export let remoteVideo: HMSTrack;
export let screenShare: HMSTrack;
export let auxiliaryAudio: HMSTrack;
export let localSpeaker: HMSSpeaker;
export let screenshareAudio: HMSTrack;

export const makeFakeStore = (): HMSStore => {
  const fakeStore: HMSStore = {
    room: {
      id: '123',
      isConnected: true,
      name: 'test room',
      peers: ['1', '2'],
      shareableLink: '',
      hasWaitingRoom: false,
      roomState: HMSRoomState.Disconnected,
    },
    peers: {
      '1': {
        id: '1',
        name: 'test1',
        role: 'student',
        isLocal: true,
        videoTrack: '101',
        audioTrack: '102',
        auxiliaryTracks: [],
      },
      '2': {
        id: '2',
        name: 'test2',
        role: 'student',
        isLocal: false,
        videoTrack: '103',
        audioTrack: '104',
        auxiliaryTracks: ['105', '106', '107'],
      },
    },
    tracks: {
      '101': makeTrack('101', 'video', 'regular'),
      '102': makeTrack('102', 'audio', 'regular'),
      '103': makeTrack('103', 'video', 'regular'),
      '104': makeTrack('104', 'audio', 'regular'),
      '105': makeTrack('105', 'video', 'screen'),
      '106': makeTrack('106', 'audio', 'regular'),
      '107': makeTrack('107', 'audio', 'screen'),
    },
    messages: {
      byID: {
        '201': {
          id: '201',
          sender: '1',
          read: true,
          type: HMSMessageType.CHAT,
          message: 'hello!',
          time: new Date(),
        },
        '202': {
          id: '202',
          sender: '2',
          read: false,
          type: HMSMessageType.CHAT,
          message: 'hi!',
          time: new Date(),
        },
      },
      allIDs: ['201', '202'],
    },
    speakers: {
      '102': {
        audioLevel: 75,
        peerID: '1',
        trackID: '102',
      },
    },
    settings: {
      audioInputDeviceId: 'testAudioIn',
      audioOutputDeviceId: 'testAudioOut',
      videoInputDeviceId: 'testVideoIn',
      maxTileCount: 12,
    },
  };
  localPeer = fakeStore.peers['1'];
  peerScreenSharing = fakeStore.peers['2'];
  localVideo = fakeStore.tracks['101'];
  localAudio = fakeStore.tracks['102'];
  remoteVideo = fakeStore.tracks['103'];
  screenShare = fakeStore.tracks['105'];
  auxiliaryAudio = fakeStore.tracks['106'];
  screenshareAudio = fakeStore.tracks['107'];
  localSpeaker = fakeStore.speakers[localPeer.audioTrack!];
  return fakeStore;
};
