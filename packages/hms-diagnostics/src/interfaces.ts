export interface HMSDiagnosticsOutputValue {
  id: string;
  success: boolean | null;
  errorMessage: string;
  info?: Record<string, any>;
}

export interface HMSDiagnosticsOutput {
  connectivity: {
    stunUDP: HMSDiagnosticsOutputValue;
    stunTCP: HMSDiagnosticsOutputValue;
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

export interface HMSDiagnosticUpdateListener {
  onUpdate: (output: HMSDiagnosticsOutputValue, path: string) => void;
}

export interface HMSDiagnosticsInterface {
  /**
   * Start all the checks in 100ms followup
   */
  start(listener: HMSDiagnosticUpdateListener): Promise<HMSDiagnosticsOutput>;
  /**
   * start connectivity test - stun, turn, init etc.
   */
  checkConnectivity(): Promise<HMSDiagnosticsOutput['connectivity']>;
  checkDevices(): Promise<HMSDiagnosticsOutput['devices']>;
  checkwebRTC(): HMSDiagnosticsOutput['webRTC'];
}

export type ConnectivityKeys = keyof HMSDiagnosticsOutput['connectivity'];
