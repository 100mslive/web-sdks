import { HMSDiagnosticsOutput } from './interfaces';

export const initialState: HMSDiagnosticsOutput = {
  connectivity: {
    stunUDP: { id: 'stunUDP', success: null, errorMessage: '' },
    stunTCP: { id: 'stunTCP', success: null, errorMessage: '' },
    turnUDP: { id: 'turnUDP', success: null, errorMessage: '' },
    turnTCP: { id: 'turnTCP', success: null, errorMessage: '' },
    init: { id: 'init', success: null, errorMessage: '' },
    websocket: { id: 'websocket', success: null, errorMessage: '' },
  },
  devices: {
    success: null,
    errorMessage: '',
    camera: { id: 'camera', success: null, errorMessage: '' },
    microphone: { id: 'microphone', success: null, errorMessage: '' },
  },
  webRTC: { id: 'webRTC', success: null, errorMessage: '' },
};
