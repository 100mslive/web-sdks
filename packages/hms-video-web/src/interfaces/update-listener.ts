import HMSException from '../error/HMSException';
import HMSTrack from '../media/tracks/HMSTrack';
import HMSPeer from './hms-peer';
import HMSRoom from './room';

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
  PEER_JOINED,
  PEER_LEFT,
  AUDIO_TOGGLED,
  VIDEO_TOGGLED,
}

export enum HMSTrackUpdate {
  TRACK_ADDED,
  TRACK_REMOVED,
  TRACK_MUTED,
  TRACK_UNMUTED,
  TRACK_DESCRIPTION_CHANGED
}

export default interface HMSUpdateListener {
  onJoin(room: HMSRoom): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer): void;
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void;
  onError(error: HMSException): void;
}
