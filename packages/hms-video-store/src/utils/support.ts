import { type IResult, UAParser } from 'ua-parser-js';
import HMSLogger from './logger';

// Initialize the parser
const uaParser = new UAParser();

// Store the enhanced result with clientHints when available
let enhancedResult: IResult | null = null;
let clientHintsPromise: Promise<IResult> | null = null;

export const isBrowser = typeof window !== 'undefined';

// Initialize clientHints in browser environment
if (isBrowser) {
  try {
    // Get the initial result
    const initialResult = uaParser.getResult();

    // Attempt to get clientHints asynchronously
    // This will return a Promise in browser environments with clientHints support
    const result = initialResult.withClientHints();

    // Check if it's a Promise (browser environment)
    if (result && typeof (result as Promise<IResult>).then === 'function') {
      clientHintsPromise = result as Promise<IResult>;
      clientHintsPromise
        .then(enhancedData => {
          enhancedResult = enhancedData;
        })
        .catch(() => {
          // Silently fail - fallback to standard UA parsing
          enhancedResult = initialResult;
        });
    } else {
      HMSLogger.d('UAParser', 'Client Hints not supported, using standard UA parsing');
      // Synchronous result (non-browser or no clientHints support)
      enhancedResult = result as IResult;
    }
  } catch {
    // Fallback to standard parsing if clientHints fails
    enhancedResult = uaParser.getResult();
  }
}

// Helper to get the best available parser result
const getParserResult = (): IResult => {
  return enhancedResult || uaParser.getResult();
};

export const parsedUserAgent = {
  getBrowser: () => getParserResult().browser,
  getOS: () => getParserResult().os,
  getDevice: () => getParserResult().device,
  getCPU: () => getParserResult().cpu,
  getEngine: () => getParserResult().engine,
  getUA: () => getParserResult().ua,
  getResult: getParserResult,
  withClientHints: () => clientHintsPromise || Promise.resolve(getParserResult()),
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

export const isPageHidden = () => typeof document !== 'undefined' && document.hidden;

export const isIOS = () => parsedUserAgent.getOS().name?.toLowerCase() === 'ios';

// safari for mac and mobile safari for iOS
export const isSafari = parsedUserAgent.getBrowser()?.name?.toLowerCase().includes('safari');

export const isFirefox = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'firefox';

export const isChromiumBased = parsedUserAgent.getEngine()?.name?.toLowerCase() === 'blink';
