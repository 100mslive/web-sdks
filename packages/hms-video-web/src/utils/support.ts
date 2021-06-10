import Bowser from 'bowser';

export const parsedUserAgent = Bowser.getParser(navigator.userAgent);

const checkIsSupported = () => {
  let isSupported = false;
  const osName = parsedUserAgent.getOSName(true);
  const engine = parsedUserAgent.getEngineName().toLowerCase();
  const browserVersion = parseInt(parsedUserAgent.getBrowserVersion().split('.')[0]);

  // Support all Chromium(>=70) based browsers on windows, macOS and Android.
  if (['windows', 'macos', 'android'].includes(osName) && engine === 'blink' && browserVersion >= 70) {
    isSupported = true;
  } else {
    isSupported = Boolean(
      parsedUserAgent.satisfies({
        windows: {
          firefox: '>=60',
        },
        macos: {
          firefox: '>=60',
        },
        android: {
          firefox: '>=60',
        },
      }),
    );
  }

  return isSupported;
};

export const isSupported = checkIsSupported();
