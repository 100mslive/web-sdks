import type { IResult } from 'ua-parser-js';
import { applyClientHints, getClientHints, parseUserAgent } from './client-hints';
import HMSLogger from './logger';

const uaResult = parseUserAgent();

// Replaced by the client hints result once it resolves.
let enhancedResult: IResult | null = null;
let clientHintsPromise: Promise<IResult> | null = null;

export const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  clientHintsPromise = Promise.resolve()
    .then(getClientHints)
    .then(hints => {
      if (!hints) {
        HMSLogger.d('UAParser', 'Client Hints not supported, using standard UA parsing');
      }
      return hints ? applyClientHints(uaResult, hints) : uaResult;
    })
    .catch(error => {
      HMSLogger.w('UAParser', 'Client Hints failed, using standard UA parsing', error);
      return uaResult;
    })
    .then(result => (enhancedResult = result));
}

const getParserResult = (): IResult => enhancedResult || uaResult;

const withClientHints = () => clientHintsPromise || Promise.resolve(getParserResult());

/** The parsed user agent; `withClientHints` keeps the shape callers used with ua-parser-js 2.x. */
export type HMSUserAgentResult = IResult & { withClientHints: () => Promise<IResult> };

export const parsedUserAgent = {
  getBrowser: () => getParserResult().browser,
  getOS: () => getParserResult().os,
  getDevice: () => getParserResult().device,
  getCPU: () => getParserResult().cpu,
  getEngine: () => getParserResult().engine,
  getUA: () => getParserResult().ua,
  getResult: (): HMSUserAgentResult => ({ ...getParserResult(), withClientHints }),
  withClientHints,
};

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

/**
 * iPadOS 13+ safari defaults to a desktop class user agent - it parses as macOS with no device type
 * and is otherwise indistinguishable from a mac, except that a mac reports no touch points.
 */
const isIPadOS = () =>
  typeof navigator !== 'undefined' &&
  navigator.maxTouchPoints > 1 &&
  Boolean(parsedUserAgent.getOS().name?.toLowerCase().includes('mac'));

/**
 * Handheld platforms do not hand capture back to a backgrounded page, so anything that reacquires a
 * device has to wait for the foreground there. Tablets behave like phones for this and iPads are the
 * common case, so neither the tablet device type nor iPadOS can be left out.
 */
export const isMobileOrTablet = () => {
  const deviceType = parsedUserAgent.getDevice().type;
  return deviceType === 'mobile' || deviceType === 'tablet' || isIPadOS();
};

export const isPageHidden = () => typeof document !== 'undefined' && document.hidden;

export const isIOS = () => parsedUserAgent.getOS().name?.toLowerCase() === 'ios';

// safari for mac and mobile safari for iOS
export const isSafari = parsedUserAgent.getBrowser()?.name?.toLowerCase().includes('safari');

export const isFirefox = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'firefox';

export const isChromiumBased = parsedUserAgent.getEngine()?.name?.toLowerCase() === 'blink';
