import { HMSReactiveStore } from "@100mslive/react-sdk";

export const hms = new HMSReactiveStore();
export const hmsStore = hms.getStore();
export const hmsActions = hms.getActions();
export const hmsNotifications = hms.getNotifications();
