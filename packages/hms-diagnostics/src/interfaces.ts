export enum HMSDiagnosticsCheck {
  WebRTC = 'WebRTC',
  Init = 'Init',
  Websocket = 'Websocket',
  StunUDP = 'StunUDP',
  TurnUDP = 'TurnUDP',
  StunTCP = 'StunTCP',
  TurnTCP = 'TurnTCP',
  Devices = 'Devices',
  Camera = 'Camera',
  Microphone = 'Microphone',
}

export const HMSDiagnosticsPath: Record<HMSDiagnosticsCheck, string> = {
  StunUDP: 'connectivity.stunUDP',
  StunTCP: 'connectivity.stunTCP',
  TurnUDP: 'connectivity.turnUDP',
  TurnTCP: 'connectivity.turnTCP',
  Init: 'connectivity.init',
  Websocket: 'connectivity.websocket',
  Devices: 'devices',
  Camera: 'devices.camera',
  Microphone: 'devices.microphone',
  WebRTC: 'webRTC',
};

export interface HMSDiagnosticsOutputValue {
  id: string;
  success: boolean | null;
  name: HMSDiagnosticsCheck;
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
    name: HMSDiagnosticsCheck;
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

  /**
   * Get informative description about what each check verifies
   */
  getDescriptionForCheck(name: HMSDiagnosticsCheck): string;
}

export type ConnectivityKeys = keyof HMSDiagnosticsOutput['connectivity'];
