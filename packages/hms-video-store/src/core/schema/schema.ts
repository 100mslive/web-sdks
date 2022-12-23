import { HMSException } from './error';
import { HMSMessage, HMSMessageID } from './message';
import { HMSPeer, HMSPeerID, HMSSpeaker, HMSTrack, HMSTrackID } from './peer';
import { HMSPlaylist } from './playlist';
import { HMSRoleChangeStoreRequest } from './requests';
import { HMSRole } from './role';
import { HMSRoom, HMSRoomState } from './room';
import { HMSMediaSettings } from './settings';
import { DeviceMap, HMSConnectionQuality, HMSPeerStats, HMSTrackStats } from '../hmsSDKStore/sdkTypes';

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
  appData?: Record<string, any>;
  roleChangeRequests: HMSRoleChangeStoreRequest[];
  sessionMetadata?: any;
  errors: HMSException[]; // for the convenience of debugging and seeing any error in devtools
}

export interface HMSStatsStore {
  remoteTrackStats: Record<HMSTrackID, HMSTrackStats | undefined>;
  localTrackStats: Record<HMSTrackID, HMSTrackStats[] | undefined>;
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
      localPeer: '',
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
    remoteTrackStats: {},
    localTrackStats: {},
    localPeer: { id: '' },
  };
};
