import { HMSDiagnosticsCheck, HMSDiagnosticsOutput } from './interfaces';

export const initialState: HMSDiagnosticsOutput = {
  connectivity: {
    stunUDP: { id: 'stunUDP', name: HMSDiagnosticsCheck.StunUDP, success: null, errorMessage: '' },
    stunTCP: { id: 'stunTCP', name: HMSDiagnosticsCheck.StunTCP, success: null, errorMessage: '' },
    turnUDP: { id: 'turnUDP', name: HMSDiagnosticsCheck.TurnUDP, success: null, errorMessage: '' },
    turnTCP: { id: 'turnTCP', name: HMSDiagnosticsCheck.TurnTCP, success: null, errorMessage: '' },
    init: { id: 'init', name: HMSDiagnosticsCheck.Init, success: null, errorMessage: '' },
    websocket: { id: 'websocket', name: HMSDiagnosticsCheck.Websocket, success: null, errorMessage: '' },
  },
  devices: {
    name: HMSDiagnosticsCheck.Devices,
    success: null,
    errorMessage: '',
    camera: { id: 'camera', name: HMSDiagnosticsCheck.Camera, success: null, errorMessage: '' },
    microphone: { id: 'microphone', name: HMSDiagnosticsCheck.Microphone, success: null, errorMessage: '' },
  },
  webRTC: { id: 'webRTC', name: HMSDiagnosticsCheck.WebRTC, success: null, errorMessage: '' },
};
