import { UAParser } from 'ua-parser-js';
import { version } from './package.alias.json';

export const parsedUserAgent = new UAParser();

export const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null &&
  !parsedUserAgent.getBrowser().name?.toLowerCase().includes('electron');

export const isBrowser = typeof window !== 'undefined';

const checkIsSupported = () => {
  if (isNode) {
    return false;
  }
  // @TODO: Get this from preview/init API from server
  return true;
};

export const isSupported = checkIsSupported();

function createUserAgent(): string {
  if (isNode) {
    return `hmsclient/${version}`;
  }
  const device = parsedUserAgent.getDevice();
  const browser = parsedUserAgent.getBrowser();
  const os = parsedUserAgent.getOS();

  if (device.type) {
    return `hmsclient/${version} ${os.name}/${os.version} (${device.vendor}_${device.type}_/_${browser.name}_${browser.version})`;
  } else {
    return `hmsclient/${version} ${os.name}/${os.version} (${browser.name}_${browser.version})`;
  }
}

export const isMobile = () => parsedUserAgent.getDevice().type === 'mobile';

export const userAgent = createUserAgent();
