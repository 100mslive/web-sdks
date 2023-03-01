import cloneDeep from 'lodash.clonedeep';
import setInObject from 'lodash.set';
import type { InitConfig } from '@100mslive/hms-video';
import {
  BuildGetMediaError,
  decodeJWT,
  HMSException,
  HMSGetMediaActions,
  HMSSdk,
  validateMediaDevicesExistence,
  validateRTCPeerConnection,
} from '@100mslive/hms-video';
import { initialState } from './initial-state';
import type { ConnectivityKeys, HMSDiagnosticsConfig } from './interfaces';
import { HMSDiagnosticsInterface, HMSDiagnosticsOutput, HMSDiagnosticUpdateListener } from './interfaces';
import { DEFAULT_DIAGNOSTICS_USERNAME, PROD_INIT_ENDPOINT } from './utils';

const descriptionForPath: Record<string, string> = {
  'connectivity.init':
    'Verifies connectivity to Init API which provides preliminary data about the session such as cluster, media servers, etc.',
  'connectivity.websocket': 'Verifies the bidirectional connectivity to 100ms server for essential communication',
  webRTC: 'Verifies if browser is WebRTC compatible and has the related necessary interfaces',
  devices:
    'Verifies if the app is used under secure context(HTTPS) and the browser navigator has access camera/microphone fetching interfaces',
  'devices.camera': 'Verifies if the camera works properly',
  'devices.microphone': 'Verifies if the microphone works properly',
};

export class HMSDiagnostics implements HMSDiagnosticsInterface {
  private result: HMSDiagnosticsOutput;
  private listener?: HMSDiagnosticUpdateListener;

  constructor() {
    this.result = cloneDeep(initialState);
  }

  async start(config: HMSDiagnosticsConfig, listener: HMSDiagnosticUpdateListener) {
    this.listener = listener;

    /**
     * @TODO check WebRTC only for publishing and subscribing roles, check HMSTransport.doesRoleNeedWebRTC
     */
    this.checkwebRTC();
    await this.checkConnectivity(config);
    await this.checkDevices();
    return this.result;
  }

  async checkConnectivity(config: HMSDiagnosticsConfig) {
    try {
      const initConfig = await this.checkInit(config);
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
          this.updateStatus({
            path: `connectivity.stunUDP`,
            id: `stunUDP-${candidate.address}:${candidate.port}`,
            info: candidate,
          });
        }

        if (candidate.protocol === 'tcp') {
          this.updateStatus({
            path: `connectivity.stunTCP`,
            id: `stunTCP-${candidate.address}:${candidate.port}`,
            info: candidate,
          });
        }
      }

      // If a relay candidate was found, the TURN server works!
      if (candidate.type === 'relay') {
        if (candidate.protocol === 'udp') {
          this.updateStatus({
            path: `connectivity.turnUDP`,
            id: `turnUDP-${candidate.address}:${candidate.port}`,
            info: candidate,
          });
        }

        if (candidate.protocol === 'tcp') {
          this.updateStatus({
            path: `connectivity.turnTCP`,
            id: `turnTCP-${candidate.address}:${candidate.port}`,
            info: candidate,
          });
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
          videoTrack,
          deviceId: settings.deviceId,
          groupId: settings.groupId,
          label: videoTrack.label,
        },
      });
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
          audioTrack,
          deviceId: settings.deviceId,
          groupId: settings.groupId,
          label: audioTrack.label,
        },
      });
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

  private async checkInit(config: HMSDiagnosticsConfig) {
    const sdk = new HMSSdk();
    const { roomId } = decodeJWT(config.authToken);

    // @ts-ignore
    sdk.commonSetup(
      {
        authToken: config.authToken,
        userName: config.userName || DEFAULT_DIAGNOSTICS_USERNAME,
      },
      roomId,
    );

    // @ts-ignore
    const initConfig = await sdk.transport.connect(
      config.authToken,
      config.initEndpoint || PROD_INIT_ENDPOINT,
      Date.now(),
      { name: 'diagnostics' },
      false,
    );
    this.updateStatus({ path: 'connectivity.init', info: initConfig });
    //@ts-ignore
    this.updateStatus({ path: 'connectivity.websocket', success: sdk.transport.signal.isConnected });
    return initConfig;
  }

  private getDescriptionForPath(path: string) {
    if (path.includes('turn') || path.includes('stun')) {
      return 'Verifies connectivity to 100ms media server';
    }
    return descriptionForPath[path];
  }

  private updateStatus({
    path,
    id = path,
    success = true,
    errorMessage,
    description,
    info,
  }: {
    path: string;
    id?: string;
    success?: boolean;
    errorMessage?: string;
    description?: string;
    info?: Record<string, any>;
  }) {
    if (!description) {
      description = this.getDescriptionForPath(path);
    }
    setInObject(this.result, path, { success, errorMessage, info });
    this.listener?.onUpdate({ id, success, errorMessage, info, description }, path);
  }
}
