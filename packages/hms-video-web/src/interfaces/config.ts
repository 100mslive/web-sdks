export default interface HMSConfig {
  userName: string;
  authToken: string;
  metaData: string;
  audioSinkElementId?: string;
  initEndpoint?: string;
}

export interface InitialSettings {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  audioDeviceID: string;
  videoDeviceID: string;
}
