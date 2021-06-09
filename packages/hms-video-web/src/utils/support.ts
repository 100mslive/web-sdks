import Bowser from 'bowser';

export const parsedUserAgent = Bowser.getParser(navigator.userAgent);

const checkIsSupported = () => {
  let isSupported = false;
  const osName = parsedUserAgent.getOSName(true);
  const engine = parsedUserAgent.getEngineName().toLowerCase();
  const browserVersion = parseInt(parsedUserAgent.getBrowserVersion().split('.')[0]);

  // Support all Chromium(>=90) based browsers on windows, macOS and Android.
  if (['windows', 'macos', 'android'].includes(osName) && engine === 'blink' && browserVersion >= 90) {
    isSupported = true;
  }

  return isSupported;
};

export const isSupported = checkIsSupported();
