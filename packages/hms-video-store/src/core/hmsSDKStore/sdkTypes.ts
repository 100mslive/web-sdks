import HMSPeer from '@100mslive/hms-video/dist/interfaces/hms-peer';
import HMSRoom from '@100mslive/hms-video/dist/interfaces/room';
import HMSMessage from '@100mslive/hms-video/dist/interfaces/message';
import HMSSpeaker from '@100mslive/hms-video/dist/interfaces/speaker';
import HMSConfig from '@100mslive/hms-video/dist/interfaces/config';
import SDKHMSAudioTrackSettings from '@100mslive/hms-video/dist/media/settings/HMSAudioTrackSettings';
import SDKHMSVideoTrackSettings from '@100mslive/hms-video/dist/media/settings/HMSVideoTrackSettings';

type HMSAudioTrackSettings = SDKHMSAudioTrackSettings;
type HMSVideoTrackSettings = SDKHMSVideoTrackSettings;

export {
  HMSPeer,
  HMSRoom,
  HMSMessage,
  HMSSpeaker,
  HMSConfig,
  HMSAudioTrackSettings,
  HMSVideoTrackSettings,
};

// temporary solution due to below problem in sdk
// https://lukasbehal.com/2017-05-22-enums-in-declaration-files/
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

export enum HMSTrackUpdate {
  TRACK_ADDED,
  TRACK_REMOVED,
  TRACK_MUTED,
  TRACK_UNMUTED,
  TRACK_DESCRIPTION_CHANGED,
}
