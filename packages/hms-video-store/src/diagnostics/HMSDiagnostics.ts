import { ConnectivityCheck } from './ConnectivityCheck';
import { DEFAULT_TEST_AUDIO_URL, diagnosticsRole } from './constants';
import { ConnectivityCheckResult, ConnectivityState, HMSDiagnosticsInterface } from './interfaces';
import { DeviceManager } from '../device-manager';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { EventBus } from '../events/EventBus';
import { HMSLocalAudioTrack, HMSLocalVideoTrack, HMSPeerType } from '../internal';
import { HMSAudioTrackSettingsBuilder, HMSTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSSdk } from '../sdk';
import { LocalTrackManager } from '../sdk/LocalTrackManager';
import { HMSLocalPeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';
import { fetchWithRetry } from '../utils/fetch';
import { sleep } from '../utils/timer-utils';

export class Diagnostics implements HMSDiagnosticsInterface {
  private store: Store;
  private eventBus: EventBus;
  private deviceManager: DeviceManager;
  private recordedAudio?: string = DEFAULT_TEST_AUDIO_URL;

  constructor(private sdk?: HMSSdk) {
    this.store = new Store();
    this.eventBus = new EventBus(false);
    this.deviceManager = new DeviceManager(this.store, this.eventBus, false);

    const localPeer = new HMSLocalPeer({
      name: 'diagnostics-peer',
      role: diagnosticsRole,
      type: HMSPeerType.REGULAR,
    });

    this.store.addPeer(localPeer);
  }

  get localPeer() {
    return this.store.getLocalPeer();
  }

  async startCameraCheck(inputDevice?: string) {
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }

    const localTrackManager = new LocalTrackManager(
      this.store,
      {
        onFailure: exception => {
          throw exception;
        },
      },
      this.deviceManager,
      this.eventBus,
    );

    this.localPeer.role = {
      ...diagnosticsRole,
      publishParams: { ...diagnosticsRole.publishParams, allowed: ['video'] },
    };
    this.deviceManager.init();
    const settings = new HMSTrackSettingsBuilder()
      .video(new HMSVideoTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await localTrackManager.getLocalTracks({ audio: false, video: true }, settings);
    const track = tracks.find(track => track.type === 'video') as HMSLocalVideoTrack;

    if (!track) {
      throw new Error('No video track found');
    }

    this.localPeer.videoTrack = track;

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

  async startMicCheck(inputDevice?: string, time = 10000) {
    const track = await this.getLocalAudioTrack(inputDevice);
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }
    if (!track) {
      throw new Error('No audio track found');
    }

    this.localPeer.audioTrack = track;

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
    const connectivityCheck = new ConnectivityCheck(this.sdk, progress, completed);
    this.sdk.setConnectivityListener(connectivityCheck);

    const authToken = await this.getAuthToken(region);
    this.sdk.join({ authToken, userName: 'diagonistic-test' }, connectivityCheck);
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

    const localTrackManager = new LocalTrackManager(
      this.store,
      {
        onFailure: exception => {
          throw exception;
        },
      },
      this.deviceManager,
      this.eventBus,
    );

    this.localPeer.role = {
      ...diagnosticsRole,
      publishParams: { ...diagnosticsRole.publishParams, allowed: ['audio'] },
    };
    this.deviceManager.init();
    const settings = new HMSTrackSettingsBuilder()
      .audio(new HMSAudioTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await localTrackManager.getLocalTracks({ audio: true, video: false }, settings);
    return tracks.find(track => track.type === 'audio') as HMSLocalAudioTrack;
  }
}
