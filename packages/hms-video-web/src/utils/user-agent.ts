import { HMSFrameworkInfo } from '../interfaces';
import { isNode, parsedUserAgent } from './support';

const sdk_version = require('../../package.json').version;

export function createUserAgent(frameworkInfo?: HMSFrameworkInfo): string {
  const sdk = 'web';

  if (isNode) {
    return convertObjectToString({
      os: 'web_nodejs',
      os_version: process.version,
      sdk,
      sdk_version,
      framework: 'node',
      framework_version: process.version,
      framework_sdk_version: frameworkInfo?.sdkVersion,
    });
  }

  const parsedOs = parsedUserAgent.getOS();
  const parsedDevice = parsedUserAgent.getDevice();
  const parsedBrowser = parsedUserAgent.getBrowser();

  const os = replaceSpaces(`web_${parsedOs.name}`);
  const os_version = parsedOs.version;

  const browser = replaceSpaces(`${parsedBrowser.name}_${parsedBrowser.version}`);
  let device_model = browser;
  if (parsedDevice.type) {
    const deviceVendor = replaceSpaces(`${parsedDevice.vendor}_${parsedDevice.type}`);
    device_model = `${deviceVendor}/${browser}`;
  }

  return convertObjectToString({
    os,
    os_version,
    sdk,
    sdk_version,
    device_model,
    framework: frameworkInfo?.type,
    framework_version: frameworkInfo?.version,
    framework_sdk_version: frameworkInfo?.sdkVersion,
  });
}

export function createUserAgentV1(): string {
  if (isNode) {
    return `hmsclient/${sdk_version} web_nodejs`;
  }
  const parsedOs = parsedUserAgent.getOS();
  const parsedDevice = parsedUserAgent.getDevice();
  const parsedBrowser = parsedUserAgent.getBrowser();

  const sdk = `hmsclient/${sdk_version}`;
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
  return s.replace(/ /g, '_');
}

const convertObjectToString = (object: Record<string, string | undefined>, delimiter = ',') =>
  Object.keys(object)
    .filter(key => !!object[key])
    .map(key => `${key}:${object[key]}`)
    .join(delimiter);
