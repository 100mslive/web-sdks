import Bowser from 'bowser';
import { version } from './package.alias.json';

export const parsedUserAgent = Bowser.getParser(navigator.userAgent);

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

const checkIsSupported = () => {
  let isSupported = false;

  if (isNode) {
    return false;
  }
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

function createUserAgent(): string {
  if (isNode) {
    return `hmsclient/${version}`;
  }
  const platform = parsedUserAgent.getPlatform();
  const browser = parsedUserAgent.getBrowser();
  const os = parsedUserAgent.getOS();

  return `hmsclient/${version} ${os.name}/${os.version} (${platform.vendor}_${platform.type}_/_${browser.name}_${browser.version})`;
}

export const userAgent = createUserAgent();
