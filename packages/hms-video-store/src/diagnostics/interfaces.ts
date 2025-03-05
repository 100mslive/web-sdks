import { RTCIceCandidatePair } from '../connection/IConnectionObserver';
import { HMSException, HMSTrack, HMSUpdateListener } from '../internal';

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
  onMediaPublished(track: HMSTrack): void;
  onICECandidate(candidate: RTCIceCandidate, isPublish: boolean): void;
  onSelectedICECandidatePairChange(candidatePair: RTCIceCandidatePair, isPublish: boolean): void;
}

export interface MediaPermissionCheck {
  audio?: boolean;
  video?: boolean;
}

export interface HMSDiagnosticsInterface {
  requestPermission(check: MediaPermissionCheck): Promise<MediaPermissionCheck>;
  checkBrowserSupport(): void;
  startMicCheck(args: {
    inputDevice?: string;
    onError?: (error: Error) => void;
    onStop?: () => void;
    time?: number;
  }): Promise<void>;
  getRecordedAudio(): string | undefined;
  stopMicCheck(): void;

  startCameraCheck(inputDevice?: string): Promise<void>;
  stopCameraCheck(): void;

  startConnectivityCheck(
    progress: (state: ConnectivityState) => void,
    completed: (result: ConnectivityCheckResult) => void,
    region?: string,
    /**
     * Number in milliseconds to stop the connectivity check
     */
    duration?: number,
  ): Promise<void>;
  stopConnectivityCheck(): Promise<void>;
}

export interface ConnectivityCheckResult {
  testTimestamp: number; // System time in millis (UTC)
  connectivityState?: ConnectivityState; // This is the initial state
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
  isPublishICEConnected: boolean; // True if ICE connected successfully for both publish and subscribe
  isSubscribeICEConnected: boolean;
  connectionQualityScore?: number; // Average of all the downlink scores for this call for this peer
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
  jitter: number;
}
