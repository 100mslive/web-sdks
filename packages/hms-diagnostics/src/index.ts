import { HMSException, validateMediaDevicesExistence, validateRTCPeerConnection } from '@100mslive/hms-video';
import { initialState } from './initial-state';
import cloneDeep from 'lodash.clonedeep';
import { HMSDiagnosticsInterface, HMSDiagnosticsOutput } from './interfaces';

export class HMSDiagnostics implements HMSDiagnosticsInterface {
  private result: HMSDiagnosticsOutput;

  constructor() {
    this.result = cloneDeep(initialState);
  }

  async start() {
    return this.result;
  }

  async checkConnectivity() {
    return this.result.connectivity;
  }

  async checkDevices() {
    try {
      validateMediaDevicesExistence();
      this.result.devices.success = true;
      this.result.devices.errorMessage = '';
    } catch (error) {
      this.result.devices.success = false;
      this.result.devices.errorMessage = (error as HMSException).message;
    }
    return this.result.devices;
  }

  async checkwebRTC() {
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
}
