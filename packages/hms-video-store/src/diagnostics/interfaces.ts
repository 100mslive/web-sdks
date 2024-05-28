import { HMSLocalAudioTrack, HMSLocalVideoTrack } from '../internal';

interface DeviceCheckReturn {
  track: HMSLocalAudioTrack | HMSLocalVideoTrack;
  stop: () => void;
}

export interface HMSDiagnosticsInterface {
  startMicCheck(inputDevice?: string, time?: number): Promise<DeviceCheckReturn>;
  startCameraCheck(inputDevice?: string): Promise<DeviceCheckReturn>;

  // startConnectivityCheck(usedId?: string, region?: string): Promise<void>;
}

export interface HMSDiagnosticsListener {
  onAudioTrack(audioTrack: HMSLocalAudioTrack): void;
  onVideoTrack(videoTrack: HMSLocalVideoTrack): void;
}
