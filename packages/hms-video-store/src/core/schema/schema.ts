import { HMSPeer, HMSPeerID, HMSTrackID, HMSTrack, HMSSpeaker } from './peer';
import { HMSMessage, HMSMessageID } from './message';
import { HMSRoom, HMSRoomState } from './room';
import { HMSMediaSettings } from './settings';
import { DeviceMap } from '../hmsSDKStore/sdkTypes';
import { HMSRole } from './role';
import { HMSRoleChangeStoreRequest } from './role';

/*
Defines the schema of the central store. UI Components are aware of the presence
of this central store. This is the global state - the single source of immutable truth.
 */
export interface HMSStore {
  room: HMSRoom;
  peers: Record<HMSPeerID, HMSPeer>;
  speakers: Record<HMSTrackID, HMSSpeaker>;
  tracks: Record<HMSTrackID, HMSTrack>;
  messages: {
    byID: Record<HMSMessageID, HMSMessage>;
    allIDs: HMSMessageID[];
  };
  settings: HMSMediaSettings;
  devices: DeviceMap;
  roles: Record<string, HMSRole>;
  roleChangeRequests: HMSRoleChangeStoreRequest[];
}

export const createDefaultStoreState = (): HMSStore => {
  return {
    room: {
      id: '',
      isConnected: false,
      name: '',
      peers: [],
      shareableLink: '',
      hasWaitingRoom: false,
      roomState: HMSRoomState.Disconnected,
    },
    peers: {},
    tracks: {},
    messages: { byID: {}, allIDs: [] },
    speakers: {},
    settings: {
      audioInputDeviceId: '',
      audioOutputDeviceId: '',
      videoInputDeviceId: '',
      maxTileCount: 9,
    },
    devices: {
      audioInput: [],
      audioOutput: [],
      videoInput: [],
    },
    roles: {},
    roleChangeRequests: [],
  };
};
