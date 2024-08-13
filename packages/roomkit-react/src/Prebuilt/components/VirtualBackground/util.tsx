import { parsedUserAgent } from '@100mslive/react-sdk';
import { isSafari } from '../../common/constants';

export const doesBrowserSupportEffectsSDK = () => {
  if (!isSafari) {
    return true;
  }
  const browserVersion = parsedUserAgent?.getBrowser()?.version || '16';
  if (browserVersion && parseInt(browserVersion.split('.')[0]) < 17) {
    return false;
  }
  return true;
};
