import { UAParser } from 'ua-parser-js';
import { v4 as uuid } from 'uuid';
import { LocalStorage } from './local-storage';
import { version } from './package.alias.json';

export const parsedUserAgent = new UAParser();

export const isNode =
  typeof window === 'undefined' && !parsedUserAgent.getBrowser().name?.toLowerCase().includes('electron');

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

const storage = new LocalStorage<string>('hms-analytics-deviceId');

export const getAnalyticsDeviceId = () => {
  let id = '';
  const storageId = storage.get();
  if (storageId) {
    id = storageId;
  } else {
    id = uuid();
    storage.set(id);
  }
  return id;
};

export const isPageHidden = () => typeof document !== 'undefined' && document.hidden;
