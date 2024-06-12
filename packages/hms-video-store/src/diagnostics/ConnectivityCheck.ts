import { ConnectivityCheckResult, ConnectivityState, HMSConnectivityListener } from './interfaces';
import { RTCIceCandidatePair } from '../connection/IConnectionObserver';
import { HMSException, HMSTrack, HMSTrackType, HMSTrackUpdate, HMSUpdateListener } from '../internal';
import { HMSSdk } from '../sdk';
import { HMSPeer } from '../sdk/models/peer';

export class ConnectivityCheck implements HMSConnectivityListener, HMSUpdateListener {
  private wsConnected = false;
  private websocketURL?: string;
  private initConnected = false;

  private isPublishICEConnected = false;
  private isSubscribeICEConnected = false;
  private selectedPublishICECandidate?: RTCIceCandidatePair;
  private selectedSubscribeICECandidate?: RTCIceCandidatePair;
  private gatheredPublishICECandidates: RTCIceCandidate[] = [];
  private gatheredSubscribeICECandidates: RTCIceCandidate[] = [];
  private networkScores: number[] = [];
  private errors: HMSException[] = [];
  private isAudioTrackCaptured = false;
  private isVideoTrackCaptured = false;

  private cleanupTimer?: number;
  private timestamp = Date.now();

  constructor(
    private sdk: HMSSdk,
    private progressCallback: (state: ConnectivityState) => void,
    private completionCallback: (state: ConnectivityCheckResult) => void,
  ) {}
  onRoomUpdate(): void {}
  onPeerUpdate(): void {}
  onMessageReceived(): void {}
  onReconnecting(): void {}
  onReconnected(): void {}
  onRoleChangeRequest(): void {}
  onRoleUpdate(): void {}
  onChangeTrackStateRequest(): void {}
  onChangeMultiTrackStateRequest(): void {}
  onRemovedFromRoom(): void {}
  onNetworkQuality?(): void {}
  onPreview(): void {}
  onDeviceChange?(): void {}
  onSessionStoreUpdate(): void {}
  onPollsUpdate(): void {}
  onWhiteboardUpdate(): void {}

  private _state: ConnectivityState = ConnectivityState.STARTING;
  private get state(): ConnectivityState {
    return this._state;
  }
  private set state(value: ConnectivityState) {
    if (value < this._state) {
      return;
    }
    this._state = value;
    this.progressCallback?.(value);
  }

  onNetworkQualityScore(score: number): void {
    if (score > 0) {
      this.networkScores.push(score);
    }
  }

  onICESuccess(isPublish: boolean): void {
    if (isPublish) {
      this.isPublishICEConnected = true;
    } else {
      this.isSubscribeICEConnected = true;
    }

    if (this.isPublishICEConnected && this.isSubscribeICEConnected) {
      this.state = ConnectivityState.ICE_ESTABLISHED;
    }
  }

  onSelectedICECandidatePairChange(candidatePair: RTCIceCandidatePair, isPublish: boolean): void {
    if (isPublish) {
      this.selectedPublishICECandidate = candidatePair;
    } else {
      this.selectedSubscribeICECandidate = candidatePair;
    }
  }

  onICECandidate(candidate: RTCIceCandidate, isPublish: boolean): void {
    if (isPublish) {
      this.gatheredPublishICECandidates.push(candidate);
    } else {
      this.gatheredSubscribeICECandidates.push(candidate);
    }
  }

  onMediaPublished(): void {
    this.state = ConnectivityState.MEDIA_PUBLISHED;
  }

  onInitSuccess(websocketURL: string): void {
    this.websocketURL = websocketURL;
    this.initConnected = true;
    this.state = ConnectivityState.INIT_FETCHED;
  }

  onSignallingSuccess(): void {
    this.wsConnected = true;
    this.state = ConnectivityState.SIGNAL_CONNECTED;
  }

  onJoin(): void {
    this.cleanupTimer = window.setTimeout(() => {
      this.cleanupAndReport();
    }, 30000);
  }

  onError(error: HMSException): void {
    this.errors.push(error);
    if (error?.isTerminal) {
      this.cleanupAndReport();
    }
  }

  // eslint-disable-next-line complexity
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void {
    if (peer.isLocal && type === HMSTrackUpdate.TRACK_ADDED) {
      switch (track.type) {
        case HMSTrackType.AUDIO:
          this.isAudioTrackCaptured = true;
          break;
        case HMSTrackType.VIDEO:
          this.isVideoTrackCaptured = true;
          break;
        default:
          break;
      }

      if (this.isVideoTrackCaptured && this.isAudioTrackCaptured) {
        this.state = ConnectivityState.MEDIA_CAPTURED;
      }
    }
  }

  private cleanupAndReport() {
    clearTimeout(this.cleanupTimer);
    this.cleanupTimer = undefined;
    if (this.state === ConnectivityState.MEDIA_PUBLISHED && this.errors.length === 0) {
      this.state = ConnectivityState.COMPLETED;
    }
    this.completionCallback?.(this.buildReport());
    this.sdk.leave();
  }

  private buildReport(): ConnectivityCheckResult {
    const connectionQualityScore = this.networkScores.reduce((a, b) => a + b, 0) / this.networkScores.length;
    // const currRTCStats = this.sdk.getWebrtcInternals()?.getCurrentStats();
    // const localPeerStats = currRTCStats?.getLocalPeerStats();
    // const localTrackStats = currRTCStats?.getLocalTrackStats();
    // const audioTrackID = this.sdk.getLocalPeer()?.audioTrack?.trackId;
    // const videoTrackID = this.sdk.getLocalPeer()?.videoTrack?.trackId;
    // const audioTrackStats = audioTrackID ? localTrackStats?.[audioTrackID] : undefined;
    // const videoTrackStats = videoTrackID ? localTrackStats?.[videoTrackID] : undefined;

    return {
      testTimestamp: this.timestamp,
      connectivityState: this.state,
      errors: this.errors,
      signallingReport: {
        isConnected: this.wsConnected,
        isInitConnected: this.initConnected,
        websocketUrl: this.websocketURL,
      },
      mediaServerReport: {
        // stats: {
        //   combined: {
        //     bytesSent: localPeerStats?.publish?.bytesSent,
        //     bytesReceived: localPeerStats?.subscribe?.bytesReceived,
        //     bitrateSent: localPeerStats?.publish?.bitrate,
        //   },
        //   audio: {},
        // },
        connectionQualityScore,
        isPublishICEConnected: this.isPublishICEConnected,
        isSubscribeICEConnected: this.isSubscribeICEConnected,
        publishICECandidatePairSelected: this.selectedPublishICECandidate,
        subscribeICECandidatePairSelected: this.selectedSubscribeICECandidate,
        publishIceCandidatesGathered: this.gatheredPublishICECandidates,
        subscribeIceCandidatesGathered: this.gatheredSubscribeICECandidates,
      },
    };
  }
}
