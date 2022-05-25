import adapter from 'webrtc-adapter';
import HMSLogger from './utils/logger';

HMSLogger.i('adapter', `${adapter.browserDetails.browser} v${adapter.browserDetails.version}`);

export * from './sdk';
export * from './media/tracks';
export * from './utils/media';
export * from './utils/device-error';
export * from './utils/support';
export * from './error/HMSException';
export * from './error/utils';
export * from './interfaces';
export * from './rtc-stats';
export * from './plugins';
export * from './utils/logger';
export type { InitConfig } from './signal/init/models';
export { validateMediaDevicesExistence, validateRTCPeerConnection } from './utils/validations';
