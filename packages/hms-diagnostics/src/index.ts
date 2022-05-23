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
    return this.result.devices;
  }

  async checkwebRTC() {
    return this.result.webRTC;
  }
}
