import { RTCIceCandidatePair } from '../connection/IConnectionObserver';
import { HMSException, HMSLocalAudioTrack, HMSLocalVideoTrack, HMSUpdateListener } from '../internal';

export interface DeviceCheckReturn {
  track: HMSLocalAudioTrack | HMSLocalVideoTrack;
  stop: () => void;
}

export enum ConnectivityState {
  STARTING,
  INIT_FETCHED,
  SIGNAL_CONNECTED,
  ICE_ESTABLISHED,
  MEDIA_CAPTURED,
  MEDIA_PUBLISHED,
  COMPLETED,
}

export interface HMSDiagnosticsConnectivityListener extends HMSUpdateListener {
  onInitSuccess(websocketURL: string): void;
  onSignallingSuccess(): void;
  onICESuccess(isPublish: boolean): void;
  onMediaPublished(): void;
  onICECandidate(candidate: RTCIceCandidate, isPublish: boolean): void;
  onSelectedICECandidatePairChange(candidatePair: RTCIceCandidatePair, isPublish: boolean): void;
}

export interface HMSDiagnosticsInterface {
  startMicCheck(inputDevice?: string, time?: number): Promise<DeviceCheckReturn>;
  getRecordedAudio(): string | undefined;
  startCameraCheck(inputDevice?: string): Promise<DeviceCheckReturn>;

  startConnectivityCheck(
    progress: (state: ConnectivityState) => void,
    completed: (result: ConnectivityCheckResult) => void,
    region?: string,
  ): Promise<void>;
}

export interface HMSDiagnosticsListener {
  onAudioTrack(audioTrack: HMSLocalAudioTrack): void;
  onVideoTrack(videoTrack: HMSLocalVideoTrack): void;
}

export interface ConnectivityCheckResult {
  testTimestamp: number; // System time in millis (UTC)
  connectivityState: ConnectivityState; // This is the initial state
  signallingReport?: SignallingReport;
  mediaServerReport?: MediaServerReport;
  // deviceTestReport?: DeviceTestReport;
  errors?: Array<HMSException>;
}

export interface SignallingReport {
  isConnected: boolean; // true if websocket was connected successfully
  isInitConnected: boolean; // True if init call was successful
  websocketUrl?: string; // websocket url
}

export interface MediaServerReport {
  stats?: DiagnosticsRTCStatsReport; // represents the overall stats of the call
  isPublishICEConnected: boolean; // True is ICE connected successfully for both publish and subscribe
  isSubscribeICEConnected: boolean;
  connectionQualityScore?: number; // Averga of all the downlink scores for this call for this peer
  publishIceCandidatesGathered?: Array<RTCIceCandidate>; // Publish ICE candidates
  subscribeIceCandidatesGathered: Array<RTCIceCandidate>; // Subscribe ICE candidates
  publishICECandidatePairSelected?: RTCIceCandidatePair; // publish ICE pair
  subscribeICECandidatePairSelected?: RTCIceCandidatePair; // subscribe ICE pair
}

export interface DiagnosticsRTCStatsReport {
  combined: DiagnosticsRTCStats;
  audio: DiagnosticsRTCStats;
  video: DiagnosticsRTCStats;
}

export interface DiagnosticsRTCStats {
  bytesSent: number;
  bytesReceived: number;
  packetsReceived: number;
  packetsLost: number;
  bitrateSent: number;
  bitrateReceived: number;
  roundTripTime: number;
}
