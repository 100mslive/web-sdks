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
} from '../../';
import { HMSPeerType, HMSSimulcastLayer } from '../../internal';
import { HMSAudioTrack, HMSPlaylist, HMSPlaylistType, HMSRole, HMSScreenVideoTrack, HMSVideoTrack } from '../../schema';

function makeTrack(
  id: HMSTrackID,
  type: HMSTrackType,
  source: HMSTrackSource,
  peerId: string,
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
    peerId: peerId,
  };
}

export let localPeer: HMSPeer;
export let remotePeerOne: HMSPeer;
export let remotePeerTwo: HMSPeer;
export let peerScreenSharing: HMSPeer;
export let localVideo: HMSVideoTrack;
export let localAudio: HMSAudioTrack;
export let remoteVideo: HMSVideoTrack;
export let screenShare: HMSScreenVideoTrack;
export let auxiliaryAudio: HMSTrack;
export let localSpeaker: HMSSpeaker;
export let screenshareAudio: HMSTrack;
export let hostRole: HMSRole;
export let speakerRole: HMSRole;
export let playlist: HMSPlaylist<any>;

export const ROLES = {
  HOST: 'host', // allowed to turn any of video, audio and screen on. can make a viewer speaker
  SPEAKER: 'speaker', // allowed to turn on audio and speak
  VIEWER: 'viewer', // allowed to watch and listen to other people, can't publish, can be converted to speaker
  NOSUBSCRIBE: 'nosubscribe', // allowed to publish but not subscribe to anything
};

export const makeFakeStore = (): HMSStore => {
  const fakeStore: HMSStore = {
    room: {
      id: '123',
      isConnected: true,
      name: 'test room',
      peers: ['1', '2', '3'],
      localPeer: '1',
      roomState: HMSRoomState.Disconnected,
      recording: {
        browser: {
          running: false,
        },
        server: {
          running: false,
        },
        hls: {
          running: false,
        },
      },
      rtmp: {
        running: false,
      },
      hls: {
        running: false,
        variants: [],
      },
      sessionId: '',
      transcriptions: [],
    },
    appData: {
      isAudioOnly: true,
    },
    templateAppData: {},
    peers: {
      '1': {
        id: '1',
        name: 'test1',
        roleName: ROLES.HOST,
        isLocal: true,
        videoTrack: '101',
        audioTrack: '102',
        auxiliaryTracks: [],
        metadata: '{}',
        groups: [],
        isHandRaised: false,
        type: HMSPeerType.REGULAR,
      },
      '2': {
        id: '2',
        name: 'test2',
        roleName: ROLES.HOST,
        isLocal: false,
        videoTrack: '103',
        audioTrack: '104',
        auxiliaryTracks: ['105', '106', '107'],
        metadata: '{"hello":"world"}',
        groups: [],
        isHandRaised: false,
        type: HMSPeerType.REGULAR,
      },
      '3': {
        id: '3',
        name: 'test3',
        roleName: ROLES.SPEAKER,
        isLocal: false,
        videoTrack: '105',
        audioTrack: '106',
        auxiliaryTracks: [],
        groups: [],
        isHandRaised: false,
        type: HMSPeerType.REGULAR,
      },
    },
    tracks: {
      '101': makeTrack('101', 'video', HMSPeerType.REGULAR, '1'),
      '102': makeTrack('102', 'audio', HMSPeerType.REGULAR, '1'),
      '103': makeTrack('103', 'video', HMSPeerType.REGULAR, '2'),
      '104': makeTrack('104', 'audio', HMSPeerType.REGULAR, '2'),
      '105': makeTrack('105', 'video', 'screen', '2'),
      '106': makeTrack('106', 'audio', HMSPeerType.REGULAR, '2'),
      '107': makeTrack('107', 'audio', 'screen', '2'),
    },
    playlist: {
      audio: {
        list: {
          audio1: {
            url: 'https://test.com/link1',
            type: HMSPlaylistType.audio,
            name: 'audio1',
            id: 'audio1',
            playing: true,
            selected: true,
          },
          audio2: {
            url: 'https://test.com/link2',
            type: HMSPlaylistType.audio,
            name: 'audio2',
            id: 'audio2',
            playing: false,
            selected: false,
          },
        },
        selection: { id: 'audio1', hasNext: true, hasPrevious: false },
        progress: 20,
        volume: 100,
        currentTime: 10,
        playbackRate: 0.5,
      },
      video: {
        list: {
          video1: {
            url: 'https://test.com/link1',
            type: HMSPlaylistType.audio,
            name: 'Video1',
            id: 'video1',
            playing: true,
            selected: true,
          },
          video2: {
            url: 'https://test.com/link2',
            type: HMSPlaylistType.audio,
            name: 'Video2',
            id: 'video2',
            playing: false,
            selected: false,
          },
        },
        selection: { id: 'video1', hasNext: true, hasPrevious: false },
        progress: 30,
        volume: 100,
        currentTime: 20,
        playbackRate: 1.0,
      },
    },
    messages: {
      byID: {
        '201': {
          id: '201',
          sender: '1',
          senderName: 'test1',
          senderRole: ROLES.HOST,
          read: true,
          type: HMSMessageType.CHAT,
          message: 'hello!',
          time: new Date(),
          ignored: false,
        },
        '202': {
          id: '202',
          sender: '2',
          senderName: 'test2',
          senderRole: ROLES.HOST,
          recipientPeer: '1',
          read: false,
          type: HMSMessageType.CHAT,
          message: 'hi!',
          time: new Date(),
          ignored: false,
        },
        '203': {
          id: '203',
          sender: '2',
          senderName: 'test2',
          senderRole: ROLES.HOST,
          recipientRoles: [ROLES.HOST],
          read: true,
          type: HMSMessageType.CHAT,
          message: 'hi!',
          time: new Date(),
          ignored: false,
        },
      },
      allIDs: ['201', '202', '203'],
    },
    speakers: {
      '102': {
        audioLevel: 75,
        peerID: '1',
        trackID: '102',
      },
    },
    connectionQualities: {
      '1': {
        peerID: '1',
        downlinkQuality: 50,
      },
      '2': {
        peerID: '2',
        downlinkQuality: 80,
      },
    },
    settings: {
      audioInputDeviceId: 'testAudioIn',
      audioOutputDeviceId: 'testAudioOut',
      videoInputDeviceId: 'testVideoIn',
    },
    roleChangeRequests: [
      {
        requestedBy: '2',
        roleName: 'speaker',
        token: '123',
      },
    ],
    roles: {
      host: {
        name: ROLES.HOST,
        publishParams: { allowed: ['audio', 'video', 'screen'] },
        subscribeParams: { subscribeToRoles: [ROLES.HOST, ROLES.SPEAKER] },
        permissions: { changeRole: true, unmute: true },
      } as HMSRole,
      viewer: {
        name: ROLES.VIEWER,
        publishParams: {},
        subscribeParams: { subscribeToRoles: [ROLES.HOST, ROLES.SPEAKER] },
      } as HMSRole,
      speaker: {
        name: ROLES.SPEAKER,
        publishParams: { allowed: ['audio'] },
        subscribeParams: { subscribeToRoles: [ROLES.HOST, ROLES.SPEAKER] },
      } as HMSRole,
      nosubscribe: {
        name: ROLES.NOSUBSCRIBE,
        subscribeParams: {},
      } as HMSRole,
    },
    devices: {
      audioInput: [],
      audioOutput: [],
      videoInput: [],
    },
    preview: {
      localPeer: '1',
      asRole: ROLES.HOST,
      videoTrack: '101',
      audioTrack: '102',
    },
    errors: [],
    sessionStore: {},
    polls: {},
    whiteboards: {},
    hideLocalPeer: false,
  };

  localPeer = fakeStore.peers['1'];
  remotePeerOne = fakeStore.peers['2'];
  remotePeerTwo = fakeStore.peers['3'];
  peerScreenSharing = fakeStore.peers['2'];
  localVideo = fakeStore.tracks['101'] as HMSVideoTrack;
  localAudio = fakeStore.tracks['102'] as HMSAudioTrack;
  remoteVideo = fakeStore.tracks['103'] as HMSVideoTrack;
  screenShare = fakeStore.tracks['105'] as HMSScreenVideoTrack;
  auxiliaryAudio = fakeStore.tracks['106'];
  screenshareAudio = fakeStore.tracks['107'];
  localSpeaker = fakeStore.speakers[localPeer.audioTrack!];
  hostRole = fakeStore.roles['host'];
  speakerRole = fakeStore.roles['speaker'];
  playlist = fakeStore.playlist;
  return fakeStore;
};
