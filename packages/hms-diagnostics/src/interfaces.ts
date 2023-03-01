export interface HMSDiagnosticsOutputValue {
  id: string;
  success: boolean | null;
  errorMessage?: string;
  description?: string;
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

export interface HMSDiagnosticsConfig {
  /**
   * the token generated for a room and role which needs to be tested
   */
  authToken: string;
  userName?: string;
  initEndpoint?: string;
}

export interface HMSDiagnosticsInterface {
  /**
   * Start all the checks in 100ms followup
   */
  start(config: HMSDiagnosticsConfig, listener: HMSDiagnosticUpdateListener): Promise<HMSDiagnosticsOutput>;
  /**
   * start connectivity test - stun, turn, init etc.
   */
  checkConnectivity(config: HMSDiagnosticsConfig): Promise<HMSDiagnosticsOutput['connectivity']>;
  checkDevices(): Promise<HMSDiagnosticsOutput['devices']>;
  checkwebRTC(): HMSDiagnosticsOutput['webRTC'];
}

export type ConnectivityKeys = keyof HMSDiagnosticsOutput['connectivity'];
