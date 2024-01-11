import { UAParser } from 'ua-parser-js';

export const parsedUserAgent = new UAParser();

export const isBrowser = typeof window !== 'undefined';

export const isNode =
  typeof window === 'undefined' && !parsedUserAgent.getBrowser().name?.toLowerCase().includes('electron');

export enum ENV {
  PROD = 'prod',
  QA = 'qa',
  DEV = 'dev',
}

const checkIsSupported = () => {
  if (isNode) {
    return false;
  }
  // @TODO: Get this from preview/init API from server
  return true;
};

export const isSupported = checkIsSupported();

export const isMobile = () => parsedUserAgent.getDevice().type === 'mobile';

export const isPageHidden = () => typeof document !== 'undefined' && document.hidden;

export const isIOS = () => parsedUserAgent.getOS().name?.toLowerCase() === 'ios';

export const isFirefox = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'firefox';
