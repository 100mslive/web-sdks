import adapter from 'webrtc-adapter';

console.log(`%c ${adapter.browserDetails.browser} v${adapter.browserDetails.version}`, 'color: #2F80FF');

export * from './sdk';
export * from './media/tracks';
export * from './interfaces/update-listener';
export * from './utils/media';
export * from './utils/device-error';
export * from './utils/support';
