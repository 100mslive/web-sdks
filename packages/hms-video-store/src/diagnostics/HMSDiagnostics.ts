import { ConnectivityCheck } from './ConnectivityCheck';
import { DEFAULT_TEST_AUDIO_URL, diagnosticsRole, MIC_CHECK_RECORD_DURATION } from './constants';
import {
  ConnectivityCheckResult,
  ConnectivityState,
  HMSDiagnosticsInterface,
  MediaPermissionCheck,
} from './interfaces';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { BuildGetMediaError } from '../error/utils';
import {
  HMSException,
  HMSLocalAudioTrack,
  HMSLocalVideoTrack,
  HMSPeerType,
  HMSPeerUpdate,
  HMSRoomUpdate,
  HMSUpdateListener,
} from '../internal';
import { HMSAudioTrackSettingsBuilder, HMSTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSSdk } from '../sdk';
import HMSRoom from '../sdk/models/HMSRoom';
import { HMSLocalPeer } from '../sdk/models/peer';
import { fetchWithRetry } from '../utils/fetch';
import { validateMediaDevicesExistence, validateRTCPeerConnection } from '../utils/validations';

export class Diagnostics implements HMSDiagnosticsInterface {
  private recordedAudio?: string = DEFAULT_TEST_AUDIO_URL;
  private mediaRecorder?: MediaRecorder;
  private connectivityCheck?: ConnectivityCheck;
  private onStopMicCheck?: () => void;

  constructor(private sdk: HMSSdk, private sdkListener: HMSUpdateListener) {
    this.sdk.setIsDiagnostics(true);
    this.initSdkWithLocalPeer();
  }

  get localPeer() {
    return this.sdk?.store.getLocalPeer();
  }

  checkBrowserSupport(): void {
    validateMediaDevicesExistence();
    validateRTCPeerConnection();
  }

  async requestPermission(check: MediaPermissionCheck): Promise<MediaPermissionCheck> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(check);
      stream.getTracks().forEach(track => track.stop());
      await this.sdk.deviceManager.init(true);
      return {
        audio: stream.getAudioTracks().length > 0,
        video: stream.getVideoTracks().length > 0,
      };
    } catch (err) {
      throw BuildGetMediaError(err as Error, this.sdk.localTrackManager.getErrorType(!!check.video, !!check.audio));
    }
  }

  async startCameraCheck(inputDevice?: string) {
    this.initSdkWithLocalPeer();
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }

    this.sdk.store.setSimulcastEnabled(false);

    this.localPeer.role = {
      ...diagnosticsRole,
      publishParams: { ...diagnosticsRole.publishParams, allowed: ['video'] },
    };
    const settings = new HMSTrackSettingsBuilder()
      .video(new HMSVideoTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await this.sdk?.localTrackManager.getLocalTracks({ audio: false, video: true }, settings);
    const track = tracks?.find(track => track.type === 'video') as HMSLocalVideoTrack;

    if (!track) {
      throw new Error('No video track found');
    }

    this.sdk?.deviceManager.init(true);
    this.localPeer.videoTrack = track;
    this.sdk?.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LIST, [this.localPeer]);
  }

  stopCameraCheck(): void {
    this.localPeer?.videoTrack?.cleanup();
    if (this.localPeer) {
      this.localPeer.videoTrack = undefined;
    }
  }

  async startMicCheck({
    inputDevice,
    onError,
    onStop,
    time = MIC_CHECK_RECORD_DURATION,
  }: {
    inputDevice?: string;
    onError?: (error: Error) => void;
    onStop?: () => void;
    time?: number;
  }) {
    this.initSdkWithLocalPeer((err: Error) => {
      this.stopMicCheck();
      onError?.(err);
    });
    const track = await this.getLocalAudioTrack(inputDevice);
    this.sdk?.deviceManager.init(true);
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }
    if (!track) {
      throw new Error('No audio track found');
    }

    this.localPeer.audioTrack = track;
    this.sdk?.initPreviewTrackAudioLevelMonitor();
    this.sdk?.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LIST, [this.localPeer]);

    this.mediaRecorder = new MediaRecorder(track.stream.nativeStream);
    const chunks: Blob[] = [];

    this.mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: this.mediaRecorder?.mimeType });
      this.recordedAudio = URL.createObjectURL(blob);
      this.onStopMicCheck?.();
    };

    this.mediaRecorder.start();

    const timeoutId = setTimeout(() => {
      this.stopMicCheck();
    }, time);

    this.onStopMicCheck = () => {
      clearTimeout(timeoutId);
      onStop?.();
    };
  }

  stopMicCheck(): void {
    this.mediaRecorder?.stop();
    this.localPeer?.audioTrack?.cleanup();
    if (this.localPeer) {
      this.localPeer.audioTrack = undefined;
    }
  }

  getRecordedAudio() {
    return this.recordedAudio;
  }

  async startConnectivityCheck(
    progress: (state: ConnectivityState) => void,
    completed: (result: ConnectivityCheckResult) => void,
    region?: string,
    duration?: number,
  ) {
    if (!this.sdk) {
      throw new Error('SDK not found');
    }

    this.connectivityCheck = new ConnectivityCheck(this.sdk, this.sdkListener, progress, completed, duration);

    const authToken = await this.getAuthToken(region);
    await this.sdk.leave();
    await this.sdk.join({ authToken, userName: 'diagnostics-test' }, this.connectivityCheck);
    this.sdk.addConnectionQualityListener({
      onConnectionQualityUpdate: qualityUpdates => {
        this.connectivityCheck?.handleConnectionQualityUpdate(qualityUpdates);
      },
    });
  }

  async stopConnectivityCheck(): Promise<void> {
    return this.connectivityCheck?.cleanupAndReport();
  }

  private initSdkWithLocalPeer(onError?: (error: Error) => void) {
    this.sdkListener &&
      this.sdk?.initStoreAndManagers({
        ...this.sdkListener,
        onError: (error: HMSException) => {
          onError?.(error);
          this.sdkListener.onError(error);
        },
      });
    const localPeer = new HMSLocalPeer({
      name: 'diagnostics-peer',
      role: diagnosticsRole,
      type: HMSPeerType.REGULAR,
    });

    this.sdk?.store.addPeer(localPeer);

    const room = new HMSRoom('diagnostics-room');
    this.sdk.store.setRoom(room);
    this.sdkListener.onRoomUpdate(HMSRoomUpdate.ROOM_PEER_COUNT_UPDATED, room);
    this.sdk?.deviceManager.init(true);
  }

  private async getAuthToken(region?: string): Promise<string> {
    const tokenAPIURL = new URL('https://api.100ms.live/v2/diagnostics/token');
    if (region) {
      tokenAPIURL.searchParams.append('region', region);
    }
    const response = await fetchWithRetry(
      tokenAPIURL.toString(),
      { method: 'GET' },
      [429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511],
    );

    const data = await response.json();

    if (!response.ok) {
      throw ErrorFactory.APIErrors.ServerErrors(data.code, HMSAction.GET_TOKEN, data.message, false);
    }

    const { token } = data;
    if (!token) {
      throw Error(data.message);
    }
    return token;
  }

  private async getLocalAudioTrack(inputDevice?: string) {
    if (!this.localPeer) {
      return;
    }

    this.localPeer.role = {
      ...diagnosticsRole,
      publishParams: { ...diagnosticsRole.publishParams, allowed: ['audio'] },
    };
    const settings = new HMSTrackSettingsBuilder()
      .audio(new HMSAudioTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await this.sdk?.localTrackManager.getLocalTracks({ audio: true, video: false }, settings);
    return tracks?.find(track => track.type === 'audio') as HMSLocalAudioTrack;
  }
}
