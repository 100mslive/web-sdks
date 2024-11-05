import adapter from 'webrtc-adapter';
import HMSLogger from './utils/logger';
const sdk_version = require('../package.json').version;

HMSLogger.d('adapter', `${adapter.browserDetails.browser} v${adapter.browserDetails.version}`);
HMSLogger.d('sdk version', sdk_version);

export * from './media/streams';
export * from './media/tracks';
export * from './utils/media';
export * from './utils/device-error';
export * from './utils/support';
export * from './error/HMSException';
export * from './error/HMSTrackException';
export * from './interfaces';
export * from './rtc-stats';
export * from './plugins';
export * from './utils/logger';
export * from './sdk/HMSPeerListIterator';
export * from './playlist-manager';
