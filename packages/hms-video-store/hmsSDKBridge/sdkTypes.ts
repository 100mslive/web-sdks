import HMSPeer from '@100mslive/100ms-web-sdk/dist/interfaces/hms-peer';
import HMSRoom from '@100mslive/100ms-web-sdk/dist/interfaces/room';
import HMSMessage from '@100mslive/100ms-web-sdk/dist/interfaces/message';
import HMSSpeaker from '@100mslive/100ms-web-sdk/dist/interfaces/speaker';
import HMSConfig from '@100mslive/100ms-web-sdk/dist/interfaces/config';

export type {HMSPeer, HMSRoom, HMSMessage, HMSSpeaker, HMSConfig};

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
