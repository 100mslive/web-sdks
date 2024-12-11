import { HMSException } from './error';
import { HMSMessage, HMSMessageID } from './message';
import { HMSPeer, HMSPeerID, HMSSpeaker, HMSTrack, HMSTrackID } from './peer';
import { HMSPlaylist } from './playlist';
import { HMSRoleChangeStoreRequest } from './requests';
import { HMSRole } from './role';
import { HMSRoom, HMSRoomState } from './room';
import { HMSMediaSettings } from './settings';
import { DeviceMap, HMSConnectionQuality, HMSPeerStats, HMSPoll, HMSTrackStats, HMSWhiteboard } from '../interfaces';

export interface HMSGenericTypes {
  sessionStore: Record<string, any>;
}

/*
 * Defines the schema of the central store. UI Components are aware of the presence
 * of this central store. This is the global state - the single source of immutable truth.
 */
export interface HMSStore<T extends HMSGenericTypes = { sessionStore: Record<string, any> }> {
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
  templateAppData: Record<string, string>;
  appData?: Record<string, any>;
  roleChangeRequests: HMSRoleChangeStoreRequest[];
  /** @deprecated use `sessionStore` instead */
  sessionMetadata?: any;
  preview?: {
    localPeer?: HMSPeerID;
    asRole?: string;
    videoTrack?: HMSTrackID;
    audioTrack?: HMSTrackID;
  };
  errors: HMSException[]; // for the convenience of debugging and seeing any error in devtools
  sessionStore: T['sessionStore'];
  polls: Record<string, HMSPoll>;
  /** @internal */
  hideLocalPeer: boolean;
  whiteboards: Record<string, HMSWhiteboard>;
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
export const createDefaultStoreState = <T extends HMSGenericTypes>(): HMSStore<T> => {
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
    sessionStore: {},
    templateAppData: {},
    polls: {},
    whiteboards: {},
    hideLocalPeer: false,
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
