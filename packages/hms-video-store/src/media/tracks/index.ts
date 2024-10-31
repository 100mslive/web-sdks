import { HMSLocalAudioTrack } from './HMSLocalAudioTrack';
import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import { HMSRemoteAudioTrack } from './HMSRemoteAudioTrack';
import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';

export type HMSRemoteTrack = HMSRemoteAudioTrack | HMSRemoteVideoTrack;
export type HMSLocalTrack = HMSLocalAudioTrack | HMSLocalVideoTrack;

export * from './HMSTrack';
export * from './HMSAudioTrack';
export * from './HMSLocalAudioTrack';
export * from './HMSRemoteAudioTrack';
export * from './HMSVideoTrack';
export * from './HMSLocalVideoTrack';
export * from './HMSRemoteVideoTrack';
export * from './HMSTrackType';
