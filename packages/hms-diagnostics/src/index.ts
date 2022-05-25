import {
  HMSException,
  validateMediaDevicesExistence,
  validateRTCPeerConnection,
  HMSGetMediaActions,
  BuildGetMediaError,
} from '@100mslive/hms-video';
import { initialState } from './initial-state';
import cloneDeep from 'lodash.clonedeep';
import { HMSDiagnosticsInterface, HMSDiagnosticsOutput } from './interfaces';

export class HMSDiagnostics implements HMSDiagnosticsInterface {
  private result: HMSDiagnosticsOutput;

  constructor() {
    this.result = cloneDeep(initialState);
  }

  async start() {
    this.checkwebRTC();
    await this.checkConnectivity();
    await this.checkDevices();
    return this.result;
  }

  async checkConnectivity() {
    await this.checkSTUNAndTURNConnectivity();
    return this.result.connectivity;
  }

  async checkDevices() {
    try {
      validateMediaDevicesExistence();
      this.result.devices.success = true;
      this.result.devices.errorMessage = '';
      await this.checkCamera();
      await this.checkMicrophone();
    } catch (error) {
      this.result.devices.success = false;
      this.result.devices.errorMessage = (error as HMSException).message;
    }
    return this.result.devices;
  }

  checkwebRTC() {
    try {
      validateRTCPeerConnection();
      this.result.webRTC.success = true;
      this.result.webRTC.errorMessage = '';
    } catch (error) {
      this.result.webRTC.success = false;
      this.result.webRTC.errorMessage = (error as HMSException).message;
    }
    return this.result.webRTC;
  }

  private async checkSTUNAndTURNConnectivity() {
    return new Promise<void>(resolve => {
      const pc = new RTCPeerConnection();
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
          this.result.connectivity.stunUDP.success = true;
          this.result.connectivity.stunUDP.info = { address: candidate.address };
        }

        if (candidate.protocol === 'tcp') {
          this.result.connectivity.stunTCP.success = true;
          this.result.connectivity.stunTCP.info = { address: candidate.address };
        }
      }

      // If a relay candidate was found, the TURN server works!
      if (candidate.type === 'relay') {
        if (candidate.protocol === 'udp') {
          this.result.connectivity.turnUDP.success = true;
          this.result.connectivity.turnUDP.info = { address: candidate.address };
        }

        if (candidate.protocol === 'tcp') {
          this.result.connectivity.turnTCP.success = true;
          this.result.connectivity.turnTCP.info = { address: candidate.address };
        }
      }
    });
  }

  private async checkCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.result.devices.camera.success = true;
      this.result.devices.camera.info = {
        deviceId: settings.deviceId,
        groupId: settings.groupId,
        label: videoTrack.label,
      };
      videoTrack.stop();
    } catch (error) {
      const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.VIDEO);
      this.result.devices.camera.success = false;
      this.result.devices.camera.errorMessage = exception.message;
      this.result.devices.camera.info = exception;
    }
  }

  private async checkMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      this.result.devices.microphone.success = true;
      this.result.devices.microphone.info = {
        deviceId: settings.deviceId,
        groupId: settings.groupId,
        label: audioTrack.label,
      };
      audioTrack.stop();
    } catch (error) {
      const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.AUDIO);
      this.result.devices.microphone.success = false;
      this.result.devices.microphone.errorMessage = exception.message;
      this.result.devices.microphone.info = exception;
    }
  }
}
