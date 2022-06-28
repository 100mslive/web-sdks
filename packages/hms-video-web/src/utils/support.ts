import { UAParser } from 'ua-parser-js';
import { v4 as uuid } from 'uuid';
import { LocalStorage } from './local-storage';
import { version } from './package.alias.json';
import HMSLogger from './logger';

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
    return `hmsclient/${version} web_nodejs`;
  }
  const parsedOs = parsedUserAgent.getOS();
  const parsedDevice = parsedUserAgent.getDevice();
  const parsedBrowser = parsedUserAgent.getBrowser();

  const sdk = `hmsclient/${version}`;
  const osNameVersion = replaceSpaces(`${parsedOs.name}/${parsedOs.version}`);
  const os = `web_${osNameVersion}`;
  const browser = replaceSpaces(`${parsedBrowser.name}_${parsedBrowser.version}`);
  let device = browser;
  if (parsedDevice.type) {
    const deviceVendor = replaceSpaces(`${parsedDevice.vendor}_${parsedDevice.type}`);
    device = `${deviceVendor}/${browser}`;
  }

  return `${sdk} ${os} ${device}`;
}

function replaceSpaces(s: string) {
  return s.replaceAll(' ', '_');
}

export const isMobile = () => parsedUserAgent.getDevice().type === 'mobile';

export const userAgent = createUserAgent();
HMSLogger.d('[Util]', 'userAgent', userAgent);

export const getAnalyticsDeviceId = () => {
  let id;
  const storage = new LocalStorage<string>('hms-analytics-deviceId');
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
