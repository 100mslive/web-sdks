import { ConnectivityCheck } from './ConnectivityCheck';
import { DEFAULT_TEST_AUDIO_URL, diagnosticsRole, MIC_CHECK_RECORD_DURATION } from './constants';
import { ConnectivityCheckResult, ConnectivityState, HMSDiagnosticsInterface } from './interfaces';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import {
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
import decodeJWT from '../utils/jwt';
import { sleep } from '../utils/timer-utils';

export class Diagnostics implements HMSDiagnosticsInterface {
  private recordedAudio?: string = DEFAULT_TEST_AUDIO_URL;
  private mediaRecorder?: MediaRecorder;
  private isConnectivityCheckInProgress = false;

  constructor(private sdk: HMSSdk, private sdkListener: HMSUpdateListener) {
    this.initSdkWithLocalPeer();
  }

  get localPeer() {
    return this.sdk?.store.getLocalPeer();
  }

  async startCameraCheck(inputDevice?: string) {
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

  async startMicCheck(inputDevice?: string, onStop?: () => void, time = MIC_CHECK_RECORD_DURATION) {
    const track = await this.getLocalAudioTrack(inputDevice);
    this.sdk?.deviceManager.init(true);
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }
    if (!track) {
      throw new Error('No audio track found');
    }

    this.localPeer.audioTrack = track;
    this.sdk?.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LIST, [this.localPeer]);

    this.mediaRecorder = new MediaRecorder(track.stream.nativeStream);
    const chunks: Blob[] = [];

    this.mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: this.mediaRecorder?.mimeType });
      this.recordedAudio = URL.createObjectURL(blob);
    };

    this.mediaRecorder.start();

    sleep(time).then(() => {
      this.stopMicCheck();
      onStop?.();
    });
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
  ) {
    if (!this.sdk) {
      throw new Error('SDK not found');
    }

    if (this.isConnectivityCheckInProgress) {
      return;
    }
    this.isConnectivityCheckInProgress = true;

    const authToken = await this.getAuthToken(region);
    const { roomId } = decodeJWT(authToken);

    this.sdk?.store.setRoom(new HMSRoom(roomId));
    await this.sdk.leave();

    const connectivityCheck = new ConnectivityCheck(this.sdk, this.sdkListener, progress, result => {
      this.isConnectivityCheckInProgress = false;
      completed(result);
    });
    await this.sdk.join(
      { authToken, userName: 'diagonistic-test', initEndpoint: 'https://qa-in2-ipv6.100ms.live/init' },
      connectivityCheck,
    );
    this.sdk.addConnectionQualityListener({
      onConnectionQualityUpdate(qualityUpdates) {
        connectivityCheck.handleConnectionQualityUpdate(qualityUpdates);
      },
    });
  }

  stopConnectivityCheck(): Promise<void> {
    return this.sdk.leave();
  }

  private initSdkWithLocalPeer() {
    this.sdkListener && this.sdk?.initStoreAndManagers(this.sdkListener);
    const localPeer = new HMSLocalPeer({
      name: 'diagnostics-peer',
      role: diagnosticsRole,
      type: HMSPeerType.REGULAR,
    });

    this.sdk?.store.addPeer(localPeer);

    const room = new HMSRoom('diagnostics-room');
    this.sdk.store.setRoom(room);
    this.sdkListener.onRoomUpdate(HMSRoomUpdate.ROOM_PEER_COUNT_UPDATED, room);
    this.sdk?.deviceManager.init();
  }

  private async getAuthToken(region?: string): Promise<string> {
    const tokenAPIURL = new URL('https://api-nonprod.100ms.live/v2/diagnostics/token');
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
    this.sdk?.deviceManager.init();
    const settings = new HMSTrackSettingsBuilder()
      .audio(new HMSAudioTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await this.sdk?.localTrackManager.getLocalTracks({ audio: true, video: false }, settings);
    return tracks?.find(track => track.type === 'audio') as HMSLocalAudioTrack;
  }
}
