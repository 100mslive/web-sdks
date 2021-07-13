import { HMSPeer, HMSPeerID, HMSTrackID, HMSTrack, HMSSpeaker } from './peer';
import { HMSMessage, HMSMessageID } from './message';
import { HMSRoom, HMSRoomState } from './room';
import { HMSMediaSettings } from './settings';

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
  };
};
