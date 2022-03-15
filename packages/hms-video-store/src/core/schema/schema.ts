import { HMSPeer, HMSPeerID, HMSTrackID, HMSTrack, HMSSpeaker } from './peer';
import { HMSMessage, HMSMessageID } from './message';
import { HMSRoom, HMSRoomState } from './room';
import { HMSMediaSettings } from './settings';
import { DeviceMap, HMSPeerStats, HMSTrackStats, HMSConnectionQuality } from '../hmsSDKStore/sdkTypes';
import { HMSRole } from './role';
import { HMSRoleChangeStoreRequest } from './requests';
import { HMSException } from './error';
import { HMSPlaylist } from './playlist';

/*
 * Defines the schema of the central store. UI Components are aware of the presence
 * of this central store. This is the global state - the single source of immutable truth.
 */
export interface HMSStore {
  room: HMSRoom;
  peers: Record<HMSPeerID, HMSPeer>;
  speakers: Record<HMSTrackID, HMSSpeaker>;
  connectionQualities: Record<HMSPeerID, HMSConnectionQuality>;
  tracks: Record<HMSTrackID, HMSTrack>;
  playlist: HMSPlaylist<any>;
  messages: {
    byID: Record<HMSMessageID, HMSMessage>;
    allIDs: HMSMessageID[];
  };
  settings: HMSMediaSettings;
  devices: DeviceMap;
  roles: Record<string, HMSRole>;
  roleChangeRequests: HMSRoleChangeStoreRequest[];
  errors: HMSException[]; // for the convenience of debugging and seeing any error in devtools
}

export interface HMSStatsStore {
  trackStats: Record<HMSTrackID, HMSTrackStats | undefined>;
  peerStats: Record<HMSPeerID, HMSPeerStats | undefined>;
  localPeer: {
    id: HMSPeerID;
    videoTrack?: HMSTrackID;
    audioTrack?: HMSTrackID;
  };
}

/**
 * @internal
 */
export const createDefaultStoreState = (): HMSStore => {
  return {
    room: {
      id: '',
      isConnected: false,
      name: '',
      peers: [],
      shareableLink: '',
      localPeer: '',
      hasWaitingRoom: false,
      roomState: HMSRoomState.Disconnected,
      recording: {
        browser: {
          running: false,
        },
        server: {
          running: false,
        },
        hls: { running: false },
      },
      rtmp: {
        running: false,
      },
      hls: {
        running: false,
        variants: [],
      },
      sessionId: '',
    },
    peers: {},
    tracks: {},
    playlist: {
      audio: {
        list: {},
        selection: { id: '', hasPrevious: false, hasNext: false },
        progress: 0,
        volume: 0,
        currentTime: 0,
        playbackRate: 1.0,
      },
      video: {
        list: {},
        selection: { id: '', hasPrevious: false, hasNext: false },
        progress: 0,
        volume: 0,
        currentTime: 0,
        playbackRate: 1.0,
      },
    },
    messages: { byID: {}, allIDs: [] },
    speakers: {},
    connectionQualities: {},
    settings: {
      audioInputDeviceId: '',
      audioOutputDeviceId: '',
      videoInputDeviceId: '',
    },
    devices: {
      audioInput: [],
      audioOutput: [],
      videoInput: [],
    },
    roles: {},
    roleChangeRequests: [],
    errors: [],
  };
};

export const createDefaultStatsStore = (): HMSStatsStore => {
  return {
    peerStats: {},
    trackStats: {},
    localPeer: { id: '' },
  };
};
