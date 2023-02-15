export interface HMSDiagnosticsOutputValue {
  id: string;
  success: boolean | null;
  errorMessage: string;
  info?: Record<string, any>;
}

export enum iceConnectionTypes {
  stunUDP = 'stunUDP',
  stunTCP = 'stunTCP',
  turnUDP = 'turnUDP',
  turnTCP = 'turnTCP',
}

export interface DiagnosticContext {
  results: HMSDiagnosticsOutput;
  config: HMSDiagnosticsConfig;
  initConfig: { endpoint: string; rtcConfiguration: RTCConfiguration };
}

export interface HMSDiagnosticsOutput {
  connectivity: {
    [iceConnectionTypes.stunUDP]: HMSDiagnosticsOutputValue;
    [iceConnectionTypes.stunTCP]: HMSDiagnosticsOutputValue;
    [iceConnectionTypes.turnUDP]: HMSDiagnosticsOutputValue;
    [iceConnectionTypes.turnTCP]: HMSDiagnosticsOutputValue;
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
  onUpdate: (output: HMSDiagnosticsOutput) => void;
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
