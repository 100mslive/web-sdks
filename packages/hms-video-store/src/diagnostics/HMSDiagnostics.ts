import { ConnectivityCheck } from './ConnectivityCheck';
import { DEFAULT_TEST_AUDIO_URL, diagnosticsRole } from './constants';
import { ConnectivityCheckResult, ConnectivityState, HMSDiagnosticsInterface } from './interfaces';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSPreviewListener } from '../interfaces/preview-listener';
import { HMSLocalAudioTrack, HMSLocalVideoTrack, HMSPeerType, HMSPeerUpdate } from '../internal';
import { HMSAudioTrackSettingsBuilder, HMSTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSSdk } from '../sdk';
import HMSRoom from '../sdk/models/HMSRoom';
import { HMSLocalPeer } from '../sdk/models/peer';
import { fetchWithRetry } from '../utils/fetch';
import decodeJWT from '../utils/jwt';
import { sleep } from '../utils/timer-utils';

export class Diagnostics implements HMSDiagnosticsInterface {
  private recordedAudio?: string = DEFAULT_TEST_AUDIO_URL;

  constructor(private sdk?: HMSSdk, private sdkListener?: HMSPreviewListener) {
    sdkListener && this.sdk?.initStoreAndManagers(sdkListener);
    const localPeer = new HMSLocalPeer({
      name: 'diagnostics-peer',
      role: diagnosticsRole,
      type: HMSPeerType.REGULAR,
    });

    this.sdk?.store.addPeer(localPeer);
    this.sdk?.deviceManager.init();
  }

  get localPeer() {
    return this.sdk?.store.getLocalPeer();
  }

  async startCameraCheck(inputDevice?: string) {
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }

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

    return {
      track,
      stop: () => {
        track.cleanup();
        if (this.localPeer) {
          this.localPeer.videoTrack = undefined;
        }
      },
    };
  }

  async startMicCheck(inputDevice?: string, onStop?: () => void, time = 10000) {
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

    const mediaRecorder = new MediaRecorder(track.stream.nativeStream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      this.recordedAudio = URL.createObjectURL(blob);
    };

    const stop = () => {
      mediaRecorder.stop();
      track.cleanup();
      if (this.localPeer) {
        this.localPeer.audioTrack = undefined;
      }
      onStop?.();
    };

    mediaRecorder.start();
    sleep(time).then(stop);

    return { track, stop };
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

    const authToken = await this.getAuthToken(region);
    const { roomId } = decodeJWT(authToken);

    this.sdk?.store.setRoom(new HMSRoom(roomId));
    await this.sdk.leave();

    const connectivityCheck = new ConnectivityCheck(this.sdk, progress, completed);
    this.sdkListener && this.sdk?.initStoreAndManagers(this.sdkListener);
    this.sdk.setConnectivityListener(connectivityCheck);
    await this.sdk.join(
      { authToken, userName: 'diagonistic-test', initEndpoint: 'https://qa-in2-ipv6.100ms.live/init' },
      connectivityCheck,
    );

    return () => this.sdk?.leave();
  }

  /** @internal */
  initLocalPeer() {}

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
