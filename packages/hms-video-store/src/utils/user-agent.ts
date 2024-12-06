import type UAParser from 'ua-parser-js';
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

/**
 * Create UserAgent string
 * @param sdkEnv - SDK environment
 * @param frameworkInfo - Framework information
 */
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

  console.error(
    'client hints',
    await parsedUserAgent.getOS().withClientHints(),
    await parsedUserAgent.getDevice().withClientHints(),
    await parsedUserAgent.getBrowser().withClientHints(),
  );

  console.error(
    'feature check: ',
    await parsedUserAgent.getOS().withFeatureCheck(),
    await parsedUserAgent.getDevice().withFeatureCheck(),
    await parsedUserAgent.getBrowser().withFeatureCheck(),
  );

  const { os, version: os_version } = await getOS();

  const device_model = await getDevice();

  const ua = convertObjectToString({
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
  console.error('UserAgent:', ua);
  return ua;
}

/**
 * Get OS name and version
 * @internal
 * @returns {Promise<{ os: string; version: string }>} OS name and version
 */
async function getOS(): Promise<{ os: string; version: string }> {
  const { name, version } = await getOSFromUserAgent();
  return getFormattedOS({ name, version });
}

/**
 * Get OS name and version initially from UserAgent with ClientHints and then with FeatureCheck
 * @internal
 * @returns {Promise<UAParser.IOS>} OS name and version
 */
async function getOSFromUserAgent(): Promise<UAParser.IOS> {
  const os = await parsedUserAgent.getOS().withClientHints();
  if (!os.name || os.name.length === 0 || !os.version || os.version.length === 0) {
    return parsedUserAgent.getOS().withFeatureCheck();
  }
  return os;
}

/**
 * Get formatted OS name and version
 * @internal
 * @param { name, version } - OS name and version
 * @returns { { os: string; version: string } } Formatted OS name and version
 */
function getFormattedOS({ name, version }: { name?: string; version?: string }): { os: string; version: string } {
  return {
    os: replaceSpaces(`web_${name}`),
    version: version || '',
  };
}

/**
 * Get Browser name and version
 * @internal
 * @returns {Promise<string | undefined>} Browser name and version string
 */
async function getBrowser(): Promise<string | undefined> {
  const { name, version } = await getBrowserFromUserAgent();
  return getFormattedBrowser({ name, version });
}

/**
 * Get Browser name and version initially from UserAgent with ClientHints and then with FeatureCheck
 * @internal
 * @returns {Promise<UAParser.IBrowser>} Browser name and version
 */
async function getBrowserFromUserAgent(): Promise<UAParser.IBrowser> {
  const browser = await parsedUserAgent.getBrowser().withClientHints();
  if (!browser.name || browser.name.length === 0 || !browser.version || browser.version.length === 0) {
    return parsedUserAgent.getBrowser().withFeatureCheck();
  }
  return browser;
}

/**
 * Get formatted Browser name and version
 * @param {name, version} - Browser name and version
 * @returns {string | undefined} Formatted Browser name and version string
 */
function getFormattedBrowser({ name, version }: { name?: string; version?: string }): string | undefined {
  return name ? `${replaceSpaces(name)}_${version}` : version;
}

/**
 * Get Device name string
 * @internal
 * @returns {Promise<string | undefined>} Device name string
 */
async function getDevice(): Promise<string | undefined> {
  const device = getFormattedDevice(await getDeviceFromUserAgent());
  const browser = await getBrowser();
  return device ? `${device}/${browser}` : browser;
}

/**
 * Get Device name string initially from UserAgent with FeatureCheck and then with ClientHints
 * @internal
 * @returns {Promise<UAParser.IDevice>} Device name string
 */
async function getDeviceFromUserAgent(): Promise<UAParser.IDevice> {
  const device = await parsedUserAgent.getDevice().withFeatureCheck();
  if (!device.vendor || device.vendor.length === 0 || !device.type || device.type.length === 0) {
    return parsedUserAgent.getDevice().withClientHints();
  }
  return device;
}

/**
 * Get formatted Device name string
 * @param {vendor, type, model} - Device vendor, type and model
 * @returns {string | undefined} Formatted Device name string
 */
function getFormattedDevice({
  vendor,
  type,
  model,
}: {
  vendor?: string;
  type?: string;
  model?: string;
}): string | undefined {
  let device = undefined;
  if (vendor) {
    device = vendor;
  }
  if (type) {
    device = getDeviceType(device, type);
  }
  if (model) {
    device = getDeviceModel(device, model);
  }
  return device ? replaceSpaces(device) : undefined;
}

function getDeviceType(device?: string, type?: string) {
  return device && device.length > 0 ? `${device}_${type}` : type;
}

function getDeviceModel(device?: string, model?: string) {
  return device && device.length > 0 ? `${device}_${model}` : model;
}

function replaceSpaces(s: string) {
  return s.replace(/ /g, '_');
}

const convertObjectToString = (object: UserAgent, delimiter = ',') =>
  Object.keys(object)
    .filter(key => isPresent(object[key as keyof UserAgent]))
    .map(key => `${key}:${object[key as keyof UserAgent]}`)
    .join(delimiter);
