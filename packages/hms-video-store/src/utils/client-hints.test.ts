import { applyClientHints, parseUserAgent, UAClientHints } from './client-hints';

interface Case {
  name: string;
  ua: string;
  hints: UAClientHints | null;
  expected: {
    browser: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { vendor?: string; model?: string; type?: string };
    cpu: { architecture?: string };
  };
}

// Expected values match what the SDK reported for these browsers before this parser change, except that
// phone builds keep the "Mobile " prefix after the hints resolve.
const cases: Case[] = [
  {
    name: 'macChrome',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      architecture: 'arm',
      bitness: '64',
      model: '',
      platformVersion: '15.1.0',
      fullVersionList: [
        {
          brand: 'Chromium',
          version: '130.0.6723.92',
        },
        {
          brand: 'Google Chrome',
          version: '130.0.6723.92',
        },
        {
          brand: 'Not?A_Brand',
          version: '99.0.0.0',
        },
      ],
      formFactors: ['Desktop'],
      platform: 'macOS',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.92',
      },
      os: {
        name: 'macOS',
        version: '15.1.0',
      },
      device: {
        vendor: 'Apple',
        model: 'Macintosh',
      },
      cpu: {
        architecture: 'arm64',
      },
    },
  },
  {
    name: 'macSafari',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    hints: null,
    expected: {
      browser: {
        name: 'Safari',
        version: '18.1',
      },
      os: {
        name: 'macOS',
        version: '10.15.7',
      },
      device: {
        vendor: 'Apple',
        model: 'Macintosh',
      },
      cpu: {},
    },
  },
  {
    name: 'winChrome11',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      architecture: 'x86',
      bitness: '64',
      model: '',
      platformVersion: '15.0.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.92',
        },
        {
          brand: 'Chromium',
          version: '130.0.6723.92',
        },
        {
          brand: 'Not_A Brand',
          version: '24.0.0.0',
        },
      ],
      formFactors: ['Desktop'],
      platform: 'Windows',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.92',
      },
      os: {
        name: 'Windows',
        version: '11',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
  {
    name: 'winEdge10',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    hints: {
      architecture: 'x86',
      bitness: '64',
      model: '',
      platformVersion: '10.0.0',
      fullVersionList: [
        {
          brand: 'Microsoft Edge',
          version: '130.0.2849.68',
        },
        {
          brand: 'Chromium',
          version: '130.0.6723.92',
        },
        {
          brand: 'Not_A Brand',
          version: '24.0.0.0',
        },
      ],
      formFactors: ['Desktop'],
      platform: 'Windows',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Edge',
        version: '130.0.2849.68',
      },
      os: {
        name: 'Windows',
        version: '10',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
  {
    name: 'androidChrome',
    ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    hints: {
      architecture: '',
      bitness: '',
      model: 'SM-S918B',
      platformVersion: '14.0.0',
      fullVersionList: [
        {
          brand: 'Chromium',
          version: '130.0.6723.102',
        },
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
        {
          brand: 'Not?A_Brand',
          version: '99.0.0.0',
        },
      ],
      formFactors: ['Mobile'],
      platform: 'Android',
      mobile: true,
    },
    expected: {
      browser: {
        name: 'Mobile Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Android',
        version: '14.0.0',
      },
      device: {
        vendor: 'Samsung',
        model: 'SM-S918B',
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'androidChromePixel',
    ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    hints: {
      model: 'Pixel 8',
      platformVersion: '15.0.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: '',
      bitness: '',
      formFactors: ['Mobile'],
      platform: 'Android',
      mobile: true,
    },
    expected: {
      browser: {
        name: 'Mobile Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Android',
        version: '15.0.0',
      },
      device: {
        vendor: 'Google',
        model: 'Pixel 8',
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'androidChromeOddModel',
    ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    hints: {
      model: 'K',
      platformVersion: '13.0.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: '',
      bitness: '',
      formFactors: ['Mobile'],
      platform: 'Android',
      mobile: true,
    },
    expected: {
      browser: {
        name: 'Mobile Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Android',
        version: '13.0.0',
      },
      device: {
        vendor: 'Generic',
        model: 'K',
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'androidSamsungBrowser',
    ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    hints: {
      model: 'SM-A536E',
      platformVersion: '14.0.0',
      fullVersionList: [
        {
          brand: 'Samsung Internet',
          version: '26.0',
        },
        {
          brand: 'Chromium',
          version: '122.0.6261.105',
        },
      ],
      architecture: '',
      bitness: '',
      formFactors: ['Mobile'],
      platform: 'Android',
      mobile: true,
    },
    expected: {
      browser: {
        name: 'Samsung Internet',
        version: '26.0',
      },
      os: {
        name: 'Android',
        version: '14.0.0',
      },
      device: {
        vendor: 'Samsung',
        model: 'SM-A536E',
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'androidTabletChrome',
    ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      model: 'SM-X710',
      platformVersion: '14.0.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: '',
      bitness: '',
      formFactors: ['Tablet'],
      platform: 'Android',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Android',
        version: '14.0.0',
      },
      device: {
        vendor: 'Samsung',
        model: 'SM-X710',
        type: 'tablet',
      },
      cpu: {},
    },
  },
  {
    name: 'androidDesktopMode',
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      model: '',
      platformVersion: '',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: 'x86',
      bitness: '64',
      formFactors: ['Desktop'],
      platform: 'Linux',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Linux',
        version: '',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
  {
    name: 'chromeos',
    ua: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      model: '',
      platformVersion: '16033.58.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: 'x86',
      bitness: '64',
      formFactors: ['Desktop'],
      platform: 'Chrome OS',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Chrome OS',
        version: '16033.58.0',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
  {
    name: 'linuxChrome',
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      model: '',
      platformVersion: '6.8.0',
      fullVersionList: [
        {
          brand: 'Google Chrome',
          version: '130.0.6723.102',
        },
      ],
      architecture: 'x86',
      bitness: '64',
      formFactors: ['Desktop'],
      platform: 'Linux',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Chrome',
        version: '130.0.6723.102',
      },
      os: {
        name: 'Linux',
        version: '6.8.0',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
  {
    name: 'iosChrome',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
    hints: null,
    expected: {
      browser: {
        name: 'Mobile Chrome',
        version: '130.0.6723.90',
      },
      os: {
        name: 'iOS',
        version: '18.1',
      },
      device: {
        vendor: 'Apple',
        model: 'iPhone',
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'androidFirefox',
    ua: 'Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0',
    hints: null,
    expected: {
      browser: {
        name: 'Mobile Firefox',
        version: '132.0',
      },
      os: {
        name: 'Android',
        version: '14',
      },
      device: {
        type: 'mobile',
      },
      cpu: {},
    },
  },
  {
    name: 'macBrave',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    hints: {
      architecture: 'arm',
      bitness: '64',
      model: '',
      platformVersion: '14.6.1',
      fullVersionList: [
        {
          brand: 'Brave',
          version: '130.0.0.0',
        },
        {
          brand: 'Chromium',
          version: '130.0.0.0',
        },
        {
          brand: 'Not?A_Brand',
          version: '99.0.0.0',
        },
      ],
      formFactors: ['Desktop'],
      platform: 'macOS',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Brave',
        version: '130.0.0.0',
      },
      os: {
        name: 'macOS',
        version: '14.6.1',
      },
      device: {
        vendor: 'Apple',
        model: 'Macintosh',
      },
      cpu: {
        architecture: 'arm64',
      },
    },
  },
  {
    name: 'winOpera',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/115.0.0.0',
    hints: {
      architecture: 'x86',
      bitness: '64',
      model: '',
      platformVersion: '19.0.0',
      fullVersionList: [
        {
          brand: 'Opera',
          version: '115.0.5322.68',
        },
        {
          brand: 'Chromium',
          version: '129.0.6668.101',
        },
        {
          brand: 'Not=A?Brand',
          version: '8.0.0.0',
        },
      ],
      formFactors: ['Desktop'],
      platform: 'Windows',
      mobile: false,
    },
    expected: {
      browser: {
        name: 'Opera',
        version: '115.0.5322.68',
      },
      os: {
        name: 'Windows',
        version: '11',
      },
      device: {},
      cpu: {
        architecture: 'amd64',
      },
    },
  },
];

describe('client hints user agent parsing', () => {
  it.each(cases)('$name', ({ ua, hints, expected }) => {
    const parsed = parseUserAgent(ua);
    const result = hints ? applyClientHints(parsed, hints) : parsed;
    // An empty and a missing version both reach telemetry as an empty os_version.
    expect({
      browser: { name: result.browser.name, version: result.browser.version },
      os: { name: result.os.name, version: result.os.version || undefined },
      device: { vendor: result.device.vendor, model: result.device.model, type: result.device.type },
      cpu: { architecture: result.cpu.architecture },
    }).toEqual({ ...expected, os: { ...expected.os, version: expected.os.version || undefined } });
  });

  it.each([
    ['V2111', 'Generic'],
    ['Infinix X6833B', 'Infinix'],
  ])('reports the model %s from vendor %s', (model, vendor) => {
    const parsed = parseUserAgent(cases.find(({ name }) => name === 'androidChromeOddModel')?.ua);
    const result = applyClientHints(parsed, { platform: 'Android', platformVersion: '14.0.0', mobile: true, model });
    expect(result.device).toEqual(expect.objectContaining({ vendor, model, type: 'mobile' }));
  });

  it('keeps the parsed result when the hints name an unknown brand', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36',
    );
    const result = applyClientHints(parsed, {
      platform: 'Windows',
      platformVersion: '15.0.0',
      fullVersionList: [
        { brand: 'Chromium', version: '128.0.6613.186' },
        { brand: 'YaBrowser', version: '24.10.0.0' },
        { brand: 'Not;A=Brand', version: '24.0.0.0' },
      ],
    });
    expect(result.browser).toEqual(parsed.browser);
    expect(result.os.version).toBe('11');
  });

  it('ignores a GREASE brand listed first', () => {
    const parsed = parseUserAgent(cases[0].ua);
    const result = applyClientHints(parsed, {
      fullVersionList: [
        { brand: 'Not)A;Brand', version: '99.0.0.0' },
        { brand: 'Chromium', version: '130.0.6723.92' },
      ],
    });
    expect(result.browser).toEqual({ name: 'Chromium', version: '130.0.6723.92', major: '130' });
  });

  it('ignores an OS version for a platform the user agent string does not report', () => {
    const desktopMode = cases.find(({ name }) => name === 'androidDesktopMode') as Case;
    const parsed = parseUserAgent(desktopMode.ua);
    const result = applyClientHints(parsed, { platform: 'Android', platformVersion: '14.0.0' });
    expect(result.os).toEqual(parsed.os);
  });

  it('keeps an embedder name when the hints list only Chromium', () => {
    const parsed = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) electron-app/1.0.0 Chrome/130.0.6723.92 Electron/33.0.2 Safari/537.36',
    );
    const result = applyClientHints(parsed, { fullVersionList: [{ brand: 'Chromium', version: '130.0.6723.92' }] });
    expect(result.browser).toEqual(parsed.browser);
    expect(result.browser.name).toBe('Electron');
  });

  it('reports a tablet from its form factor when the model is not reported', () => {
    const parsed = parseUserAgent(cases[0].ua);
    const result = applyClientHints(parsed, { mobile: false, model: '', formFactors: ['Tablet'] });
    expect(result.device.type).toBe('tablet');
  });

  it('ignores hint values that name Object.prototype members', () => {
    const parsed = parseUserAgent(cases[0].ua);
    const result = applyClientHints(parsed, {
      fullVersionList: [{ brand: 'constructor', version: '1.0' }],
      formFactors: ['toString'],
      architecture: '__proto__',
    });
    expect(result.browser).toEqual(parsed.browser);
    expect(result.device.type).toBeUndefined();
    expect(result.cpu.architecture).toBeUndefined();
  });

  it('does not mutate the parsed result', () => {
    const parsed = parseUserAgent(cases[0].ua);
    const before = JSON.stringify(parsed);
    applyClientHints(parsed, cases[0].hints as UAClientHints);
    expect(JSON.stringify(parsed)).toBe(before);
  });
});
