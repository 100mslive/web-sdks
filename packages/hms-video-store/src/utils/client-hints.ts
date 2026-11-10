import { type IResult, UAParser } from 'ua-parser-js';

/** The User-Agent Client Hints values the SDK reads, see https://wicg.github.io/ua-client-hints. */
export interface UAClientHints {
  platform?: string;
  platformVersion?: string;
  mobile?: boolean;
  model?: string;
  architecture?: string;
  bitness?: string;
  formFactors?: string[];
  fullVersionList?: { brand: string; version: string }[];
}

interface NavigatorUAData {
  getHighEntropyValues(hints: string[]): Promise<UAClientHints>;
}

export const HIGH_ENTROPY_HINTS = [
  'architecture',
  'bitness',
  'formFactors',
  'fullVersionList',
  'model',
  'platformVersion',
];

const OS_NAMES: Record<string, string> = { 'Mac OS': 'macOS', 'Chromium OS': 'Chrome OS' };

const BRAND_NAMES: Record<string, string> = {
  'Google Chrome': 'Chrome',
  'Microsoft Edge': 'Edge',
  Opera: 'Opera',
  Brave: 'Brave',
  'Samsung Internet': 'Samsung Internet',
};

const GREASE_BRAND = /not.?a.?brand/i;

// The phone builds of these browsers are reported under a "Mobile " prefix.
const MOBILE_BUILDS: Record<string, RegExp> = {
  Chrome: /\b(?:crios|crmo)\/|\bchrome\/[\w.]+ mobile/i,
  Firefox: /\bfxios\/|(?:mobile|tablet);.*\bfirefox\//i,
};

const CPU_ARCHITECTURES: Record<string, string> = {
  'x86/64': 'amd64',
  'x86/32': 'ia32',
  'arm/64': 'arm64',
  'arm/32': 'arm',
};

/** Resolves the high entropy hints, or null where the browser does not expose them (Safari, Firefox). */
export const getClientHints = (): Promise<UAClientHints | null> => {
  const uaData = (globalThis.navigator as { userAgentData?: NavigatorUAData } | undefined)?.userAgentData;
  if (!uaData?.getHighEntropyValues) {
    return Promise.resolve(null);
  }
  return uaData.getHighEntropyValues(HIGH_ENTROPY_HINTS);
};

/**
 * Parses a user agent string with stable names: `macOS`, `Chrome OS`, and `Mobile Chrome` / `Mobile Firefox`
 * for the phone builds. These are the names SDK telemetry and Prebuilt checks have been reporting and matching.
 */
export const parseUserAgent = (ua?: string): IResult => {
  const result = new UAParser(ua).getResult();
  const osName = result.os.name || '';
  const browserName = result.browser.name || '';
  result.os.name = OS_NAMES[osName] || result.os.name;
  if (MOBILE_BUILDS[browserName]?.test(result.ua)) {
    result.browser.name = `Mobile ${browserName}`;
  }
  return result;
};

/**
 * Overlays client hints on a parsed user agent. Chromium freezes the user agent string at macOS 10.15.7,
 * Windows 10 and Android 10 model "K", so the real OS version, device model and browser version only
 * come from the hints.
 */
export const applyClientHints = (parsed: IResult, hints: UAClientHints): IResult => {
  const brand = pickBrand(hints.fullVersionList);
  const browser = brand ? { ...brand, major: brand.version.split('.')[0] } : parsed.browser;
  return {
    ...parsed,
    browser,
    os: { ...parsed.os, version: clientHintsOSVersion(parsed.os.name, hints) || parsed.os.version },
    device: clientHintsDevice(parsed.device, hints),
    cpu: { ...parsed.cpu, architecture: cpuArchitecture(hints) || parsed.cpu.architecture },
  };
};

/** Picks the browser brand, skipping GREASE entries and Chromium when a branded browser is also listed. */
const pickBrand = (brands: UAClientHints['fullVersionList'] = []) => {
  const real = brands.filter(({ brand }) => !GREASE_BRAND.test(brand));
  const known = real.find(({ brand }) => BRAND_NAMES[brand]);
  if (known) {
    return { name: BRAND_NAMES[known.brand], version: known.version };
  }
  // Only plain Chromium may name itself; an unknown brand keeps what the user agent string parsed to.
  const onlyChromium = real.length === 1 && real[0].brand === 'Chromium';
  return onlyChromium ? { name: 'Chromium', version: real[0].version } : undefined;
};

const clientHintsOSVersion = (osName = '', { platform = osName, platformVersion }: UAClientHints) => {
  // Android in desktop mode sends a Linux user agent, so hints for a different platform are ignored.
  if (!platformVersion || platform.toLowerCase() !== osName.toLowerCase()) {
    return undefined;
  }
  return osName === 'Windows' ? windowsVersion(platformVersion) : platformVersion;
};

// Microsoft's mapping: platformVersion 13+ is Windows 11, 1-10 is Windows 10, 0 is older.
const windowsVersion = (platformVersion: string) => {
  const major = parseInt(platformVersion, 10);
  return major >= 13 ? '11' : major > 0 ? '10' : undefined;
};

const clientHintsDevice = (device: IResult['device'], hints: UAClientHints): IResult['device'] => {
  if (!hints.model) {
    return { ...device, type: device.type || mobileType(hints) };
  }
  const resolved = parseDeviceModel(hints);
  return {
    model: hints.model,
    // Telemetry groups unrecognised models under "Generic".
    vendor: resolved.vendor || 'Generic',
    type: mobileType(hints) || resolved.type || device.type,
  };
};

const mobileType = ({ mobile }: UAClientHints) => (mobile ? 'mobile' : undefined);

/** Resolves the vendor and form factor of a model name through the user agent parser's device table. */
const parseDeviceModel = ({ model, platformVersion = '10', mobile }: UAClientHints) => {
  const form = mobile ? 'Mobile ' : '';
  const ua = `Mozilla/5.0 (Linux; Android ${platformVersion}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 ${form}Safari/537.36`;
  return new UAParser(ua).getDevice();
};

const cpuArchitecture = ({ architecture, bitness }: UAClientHints) =>
  CPU_ARCHITECTURES[`${architecture}/${bitness === '64' ? '64' : '32'}`];
