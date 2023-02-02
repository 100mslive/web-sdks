import {
  HMSException,
  validateMediaDevicesExistence,
  validateRTCPeerConnection,
  HMSGetMediaActions,
  BuildGetMediaError,
  HMSSdk,
} from '@100mslive/hms-video';
import type { InitConfig } from '@100mslive/hms-video';
import cloneDeep from 'lodash.clonedeep';
import setInObject from 'lodash.set';
import { initialState } from './initial-state';
import { HMSDiagnosticsInterface, HMSDiagnosticsOutput, HMSDiagnosticUpdateListener } from './interfaces';
import type { ConnectivityKeys } from './interfaces';
import { getToken } from './utils';

export class HMSDiagnostics implements HMSDiagnosticsInterface {
  private result: HMSDiagnosticsOutput;
  private listener?: HMSDiagnosticUpdateListener;

  constructor() {
    this.result = cloneDeep(initialState);
  }

  async start(listener: HMSDiagnosticUpdateListener) {
    this.listener = listener;
    this.checkwebRTC();
    await this.checkConnectivity();
    await this.checkDevices();
    return this.result;
  }

  async checkConnectivity() {
    try {
      const initConfig = await this.checkInit();
      await this.checkSTUNAndTURNConnectivity(initConfig);
    } catch (error) {
      this.updateStatus({ path: 'connectivity.init', success: false, errorMessage: (error as Error).message });
    }
    (Object.keys(this.result.connectivity) as ConnectivityKeys[]).forEach((connectionType: ConnectivityKeys) => {
      const status = this.result.connectivity[connectionType].success;
      if (status === null) {
        this.updateStatus({ path: `connectivity.${connectionType}`, success: false });
      }
    });
    return this.result.connectivity;
  }

  async checkDevices() {
    try {
      validateMediaDevicesExistence();
      this.updateStatus({ path: 'devices' });
      await this.checkCamera();
      await this.checkMicrophone();
    } catch (error) {
      this.updateStatus({
        path: 'devices',
        errorMessage: (error as HMSException).message,
        info: error as HMSException,
      });
    }
    return this.result.devices;
  }

  checkwebRTC() {
    try {
      validateRTCPeerConnection();
      this.updateStatus({ path: 'webRTC' });
    } catch (error) {
      this.updateStatus({
        path: 'webRTC',
        success: false,
        errorMessage: (error as HMSException).message,
        info: error as HMSException,
      });
    }
    return this.result.webRTC;
  }

  private async checkSTUNAndTURNConnectivity(initConfig: InitConfig) {
    return new Promise<void>(resolve => {
      const pc = new RTCPeerConnection(initConfig.rtcConfiguration);
      const iceCandidates: RTCIceCandidate[] = [];
      pc.createDataChannel('');
      pc.onicecandidateerror = e => console.error(e);
      pc.onicecandidate = e => {
        if (!e.candidate) {
          this.verifyICECandidates(iceCandidates);
          resolve();
          return;
        }
        iceCandidates.push(e.candidate);
      };
      (async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
      })();
    });
  }

  private verifyICECandidates(iceCandidates: RTCIceCandidate[]) {
    // eslint-disable-next-line complexity
    iceCandidates.forEach(candidate => {
      // If a srflx candidate was found, the STUN server works!
      if (candidate.type === 'srflx') {
        if (candidate.protocol === 'udp') {
          this.updateStatus({ path: 'connectivity.stunUDP', info: candidate });
        }

        if (candidate.protocol === 'tcp') {
          this.updateStatus({ path: 'connectivity.stunTCP', info: candidate });
        }
      }

      // If a relay candidate was found, the TURN server works!
      if (candidate.type === 'relay') {
        if (candidate.protocol === 'udp') {
          this.updateStatus({ path: 'connectivity.turnUDP', info: candidate });
        }

        if (candidate.protocol === 'tcp') {
          this.updateStatus({ path: 'connectivity.turnTCP', info: candidate });
        }
      }
    });
  }

  private async checkCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.updateStatus({
        path: 'devices.camera',
        info: {
          deviceId: settings.deviceId,
          groupId: settings.groupId,
          label: videoTrack.label,
        },
      });
      videoTrack.stop();
    } catch (error) {
      const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.VIDEO);
      this.updateStatus({
        path: 'devices.camera',
        info: exception,
        errorMessage: exception.message,
        success: false,
      });
    }
  }

  private async checkMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      this.updateStatus({
        path: 'devices.microphone',
        info: {
          deviceId: settings.deviceId,
          groupId: settings.groupId,
          label: audioTrack.label,
        },
      });
      audioTrack.stop();
    } catch (error) {
      const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.AUDIO);
      this.updateStatus({
        path: 'devices.microphone',
        success: false,
        errorMessage: exception.message,
        info: exception,
      });
    }
  }

  private async checkInit() {
    const sdk = new HMSSdk();

    const token = await getToken();
    if (!token) {
      this.updateStatus({ path: 'connectivity.init', success: false, errorMessage: 'Failed to create token' });
      return;
    }
    const config: HMSConfig = {
      authToken: token,
      userName: userName,
    };
    // @ts-ignore
    sdk.commonSetup(config, roomId);

    // @ts-ignore
    const initConfig = await sdk.transport.connect(
      token,
      'https://qa-init.100ms.live/',
      Date.now(),
      { name: 'diagnostics' },
      false,
    );
    this.updateStatus({ path: 'connectivity.init', info: initConfig });
    //@ts-ignore
    this.updateStatus({ path: 'connectivity.websocket', success: sdk.transport.signal.isConnected });
    return initConfig;
  }

  private updateStatus({
    path,
    success = true,
    errorMessage = '',
    info,
  }: {
    path: string;
    success?: boolean;
    errorMessage?: string;
    info?: Record<string, any>;
  }) {
    setInObject(this.result, path, { success, errorMessage, info });
    this.listener?.onUpdate({ success, errorMessage, info }, path);
  }
}
