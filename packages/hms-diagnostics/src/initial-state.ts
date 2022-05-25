import { HMSDiagnosticsOutput } from './interfaces';

export const initialState: HMSDiagnosticsOutput = {
  connectivity: {
    stunUDP: { success: null, errorMessage: '' },
    stunTCP: { success: null, errorMessage: '' },
    turnUDP: { success: null, errorMessage: '' },
    turnTCP: { success: null, errorMessage: '' },
    init: { success: null, errorMessage: '' },
    websocket: { success: null, errorMessage: '' },
  },
  devices: {
    success: null,
    errorMessage: '',
    camera: { success: null, errorMessage: '' },
    microphone: { success: null, errorMessage: '' },
  },
  webRTC: { success: null, errorMessage: '' },
};
