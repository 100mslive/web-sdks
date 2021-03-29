import HMSRoom from './room';
import { HMSError } from './types';

export enum HMSRoomUpdate {
  PEER_ADDED,
  PEER_REMOVED,
  PEER_KNOCKED,
  ROOM_TYPE_CHANGED,
  METADATA_UPDATED,
  SCREENSHARE_STARTED,
  SCREENSHARE_STOPPED,
  DEFAULT_UPDATE,
}

export enum HMSPeerUpdate {
  VIDEO_TRACK_ADDED,
  VIDEO_TRACK_REMOVED,
  AUDIO_TRACK_ADDED,
  AUDIO_TRACK_REMOVED,
  AUDIO_TOGGLED,
  VIDEO_TOGGLED,
  ROLE_UPDATED,
  DEFAULT_UPDATE,
}

export default interface HMSUpdateListener {
  onJoin(room: HMSRoom): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, room: HMSRoom): void;
  onerror(error: HMSError): void;
}
