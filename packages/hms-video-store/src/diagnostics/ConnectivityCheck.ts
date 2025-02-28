import { CONNECTIVITY_TEST_DURATION } from './constants';
import { CQSCalculator } from './CQSCalculator';
import { DiagnosticsStatsCollector } from './DiagnosticsStatsCollector';
import { ConnectivityCheckResult, ConnectivityState, HMSDiagnosticsConnectivityListener } from './interfaces';
import { RTCIceCandidatePair } from '../connection/IConnectionObserver';
import {
  HMSConnectionQuality,
  HMSException,
  HMSRoom,
  HMSTrack,
  HMSTrackType,
  HMSTrackUpdate,
  HMSUpdateListener,
} from '../internal';
import { HMSSdk } from '../sdk';
import { HMSPeer } from '../sdk/models/peer';

export class ConnectivityCheck implements HMSDiagnosticsConnectivityListener {
  private wsConnected = false;
  private websocketURL?: string;
  private initConnected = false;

  private isPublishICEConnected = false;
  private isSubscribeICEConnected = false;
  private selectedPublishICECandidate?: RTCIceCandidatePair;
  private selectedSubscribeICECandidate?: RTCIceCandidatePair;
  private gatheredPublishICECandidates: RTCIceCandidate[] = [];
  private gatheredSubscribeICECandidates: RTCIceCandidate[] = [];
  private errors: HMSException[] = [];
  private isAudioTrackCaptured = false;
  private isVideoTrackCaptured = false;
  private isAudioTrackPublished = false;
  private isVideoTrackPublished = false;
  private statsCollector: DiagnosticsStatsCollector;
  private cqsCalculator = new CQSCalculator();

  private cleanupTimer?: number;
  private timestamp = Date.now();
  private _state?: ConnectivityState;
  private get state(): ConnectivityState | undefined {
    return this._state;
  }
  private set state(value: ConnectivityState | undefined) {
    if (value === undefined || (this._state !== undefined && value < this._state)) {
      return;
    }
    this._state = value;
    this.progressCallback?.(value);
  }

  constructor(
    private sdk: HMSSdk,
    private sdkListener: HMSUpdateListener,
    private progressCallback: (state: ConnectivityState) => void,
    private completionCallback: (state: ConnectivityCheckResult) => void,
    private connectivityDuration = CONNECTIVITY_TEST_DURATION,
  ) {
    this.statsCollector = new DiagnosticsStatsCollector(sdk);
    this.state = ConnectivityState.STARTING;
  }
  onRoomUpdate = this.sdkListener.onRoomUpdate.bind(this.sdkListener);
  onPeerUpdate = this.sdkListener.onPeerUpdate.bind(this.sdkListener);
  onMessageReceived = this.sdkListener.onMessageReceived.bind(this.sdkListener);
  onReconnected = this.sdkListener.onReconnected.bind(this.sdkListener);
  onRoleChangeRequest = this.sdkListener.onRoleChangeRequest.bind(this.sdkListener);
  onRoleUpdate = this.sdkListener.onRoleUpdate.bind(this.sdkListener);
  onChangeTrackStateRequest = this.sdkListener.onChangeTrackStateRequest.bind(this.sdkListener);
  onChangeMultiTrackStateRequest = this.sdkListener.onChangeMultiTrackStateRequest.bind(this.sdkListener);
  onRemovedFromRoom = this.sdkListener.onRemovedFromRoom.bind(this.sdkListener);
  onNetworkQuality = this.sdkListener.onNetworkQuality?.bind(this.sdkListener);
  onPreview = this.sdkListener.onPreview.bind(this.sdkListener);
  onDeviceChange = this.sdkListener.onDeviceChange?.bind(this.sdkListener);
  onSessionStoreUpdate = this.sdkListener.onSessionStoreUpdate.bind(this.sdkListener);
  onPollsUpdate = this.sdkListener.onPollsUpdate.bind(this.sdkListener);
  onWhiteboardUpdate = this.sdkListener.onWhiteboardUpdate.bind(this.sdkListener);

  handleConnectionQualityUpdate = (qualities: HMSConnectionQuality[]) => {
    const localPeerQuality = qualities.find(quality => quality.peerID === this.sdk?.store.getLocalPeer()?.peerId);
    this.cqsCalculator.pushScore(localPeerQuality?.downlinkQuality);
  };

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

  onMediaPublished(track: HMSTrack): void {
    switch (track.type) {
      case HMSTrackType.AUDIO:
        this.isAudioTrackPublished = true;
        break;
      case HMSTrackType.VIDEO:
        this.isVideoTrackPublished = true;
        break;
      default:
        break;
    }

    if (this.isVideoTrackPublished && this.isAudioTrackPublished) {
      this.state = ConnectivityState.MEDIA_PUBLISHED;
    }
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

  onJoin(room: HMSRoom): void {
    this.sdkListener.onJoin(room);
    this.sdk.getWebrtcInternals()?.onStatsChange(stats => this.statsCollector.handleStatsUpdate(stats));
    this.sdk.getWebrtcInternals()?.start();
    this.cleanupTimer = window.setTimeout(() => {
      this.cleanupAndReport();
    }, this.connectivityDuration);
  }

  onError(error: HMSException): void {
    this.sdkListener.onError(error);
    this.errors.push(error);
    if (error?.isTerminal) {
      this.cleanupAndReport();
    }
  }

  // eslint-disable-next-line complexity
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void {
    this.sdkListener.onTrackUpdate(type, track, peer);
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

  onReconnecting(error: HMSException): void {
    this.sdkListener.onReconnecting(error);
    this.cqsCalculator.addPendingCQSTillNow();
  }

  cleanupAndReport() {
    clearTimeout(this.cleanupTimer);
    this.cleanupTimer = undefined;
    if (this.state === ConnectivityState.MEDIA_PUBLISHED) {
      this.state = ConnectivityState.COMPLETED;
    }
    this.completionCallback?.(this.buildReport());
    this.sdk.leave();
  }

  private buildReport(): ConnectivityCheckResult {
    this.cqsCalculator.addPendingCQSTillNow();
    const connectionQualityScore = this.cqsCalculator.getCQS();
    const stats = this.statsCollector.buildReport();
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
        stats,
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
