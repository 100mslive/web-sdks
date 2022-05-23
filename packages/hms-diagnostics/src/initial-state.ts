import { HMSDiagnosticsOutput } from './interfaces';

export const initialState: HMSDiagnosticsOutput = {
  connectivity: {
    stun: { success: false, errorMessage: '' },
    turnUDP: { success: false, errorMessage: '' },
    turnTCP: { success: false, errorMessage: '' },
    init: { success: false, errorMessage: '' },
    websocket: { success: false, errorMessage: '' },
  },
  devices: {
    camera: { success: false, errorMessage: '' },
    microphone: { success: false, errorMessage: '' },
  },
  webRTC: { success: false, errorMessage: '' },
};
