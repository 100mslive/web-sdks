// @ts-check
import { HMSReactiveStore } from '@100mslive/hms-video-store';

const hms = new HMSReactiveStore();
export const hmsStore = hms.getStore();
export const hmsActions = hms.getActions();
export const hmsNotifications = hms.getNotifications();
export const hmsStats = hms.getStats();
export const hmsDiagnostics = hms.getDiagnosticsSDK();
