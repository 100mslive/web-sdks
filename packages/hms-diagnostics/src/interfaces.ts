export interface HMSDiagnosticsOutputValue {
  success: boolean | null;
  errorMessage: string;
  info?: Record<string, any>;
}

export interface HMSDiagnosticsOutput {
  connectivity: {
    stun: HMSDiagnosticsOutputValue;
    turnUDP: HMSDiagnosticsOutputValue;
    turnTCP: HMSDiagnosticsOutputValue;
    init: HMSDiagnosticsOutputValue;
    websocket: HMSDiagnosticsOutputValue;
  };
  devices: {
    success: boolean | null;
    errorMessage: string;
    camera: HMSDiagnosticsOutputValue;
    microphone: HMSDiagnosticsOutputValue;
  };
  webRTC: HMSDiagnosticsOutputValue;
}

export interface HMSDiagnosticsInterface {
  /**
   * Start all the checks in 100ms followup
   */
  start(): Promise<HMSDiagnosticsOutput>;
  /**
   * start connectivity test - stun, turn, init etc.
   */
  checkConnectivity(): Promise<HMSDiagnosticsOutput['connectivity']>;
  checkDevices(): Promise<HMSDiagnosticsOutput['devices']>;
  checkwebRTC(): Promise<HMSDiagnosticsOutput['webRTC']>;
}
