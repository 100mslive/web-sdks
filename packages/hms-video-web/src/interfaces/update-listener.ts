import HMSException from '../error/HMSException';
import HMSTrack from '../media/tracks/HMSTrack';
import HMSPeer from './hms-peer';
import HMSMessage from './message';
import HMSRoom from './room';
import HMSSpeaker from './speaker';

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
  BECAME_DOMINANT_SPEAKER,
  RESIGNED_DOMINANT_SPEAKER,
  STARTED_SPEAKING,
  STOPPED_SPEAKING,
}

export enum HMSTrackUpdate {
  TRACK_ADDED,
  TRACK_REMOVED,
  TRACK_MUTED,
  TRACK_UNMUTED,
  TRACK_DESCRIPTION_CHANGED,
}

export interface HMSAudioListener {
  onAudioLevelUpdate(speakers: HMSSpeaker[]): void;
}

export default interface HMSUpdateListener {
  onJoin(room: HMSRoom): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer | null): void;
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void;
  onMessageReceived(message: HMSMessage): void;
  onError(error: HMSException): void;
}
