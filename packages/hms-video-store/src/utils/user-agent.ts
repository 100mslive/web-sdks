import { ENV, isNode, parsedUserAgent } from './support';
import { isPresent } from './validations';
import { DomainCategory } from '../analytics/AnalyticsEventDomains';
import { domainCategory } from '../analytics/domain-analytics';
import { HMSFrameworkInfo } from '../interfaces';

const sdk_version = require('../../package.json').version;

type UserAgent = {
  os: string;
  os_version: string;
  sdk: 'web';
  sdk_version: string;
  env: 'debug' | 'prod';
  domain: DomainCategory;
  is_prebuilt: boolean;
  device_model?: string;
  framework?: HMSFrameworkInfo['type'] | 'node';
  framework_version?: HMSFrameworkInfo['version'];
  framework_sdk_version?: HMSFrameworkInfo['sdkVersion'];
};

export async function createUserAgent(sdkEnv: ENV = ENV.PROD, frameworkInfo?: HMSFrameworkInfo) {
  const sdk = 'web';
  const env = domainCategory !== DomainCategory.LOCAL && sdkEnv === ENV.PROD ? 'prod' : 'debug';

  if (isNode) {
    return convertObjectToString({
      os: 'web_nodejs',
      os_version: process.version,
      sdk,
      sdk_version,
      env,
      domain: domainCategory,
      is_prebuilt: !!frameworkInfo?.isPrebuilt,
      framework: 'node',
      framework_version: process.version,
      framework_sdk_version: frameworkInfo?.sdkVersion,
    });
  }

  /**
   * User agent client hints are not yet supported on firefox and safari https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API#browser_compatibility
   * the fallback navigator.userAgent would still report the old/incorrect versions on these browsers
   */
  const parsedOs = await parsedUserAgent.getOS().withClientHints();
  const parsedDevice = await parsedUserAgent.getDevice().withClientHints();
  // const parsedBrowser = await parsedUserAgent.getBrowser().withClientHints();
  const parsedBrowser = parsedUserAgent.getBrowser();

  // console.log('log ', parsedBrowser, parsedBrowser1);

  const os = replaceSpaces(`web_${parsedOs.name}`);
  const os_version = parsedOs.version || '';

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
    env,
    domain: domainCategory,
    is_prebuilt: !!frameworkInfo?.isPrebuilt,
    framework: frameworkInfo?.type,
    framework_version: frameworkInfo?.version,
    framework_sdk_version: frameworkInfo?.sdkVersion,
  });
}

function replaceSpaces(s: string) {
  return s.replace(/ /g, '_');
}

const convertObjectToString = (object: UserAgent, delimiter = ',') =>
  Object.keys(object)
    .filter(key => isPresent(object[key as keyof UserAgent]))
    .map(key => `${key}:${object[key as keyof UserAgent]}`)
    .join(delimiter);
