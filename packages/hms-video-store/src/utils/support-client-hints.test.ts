const setUserAgentData = (userAgentData?: { getHighEntropyValues: () => Promise<unknown> }) => {
  Object.defineProperty(navigator, 'userAgentData', { value: userAgentData, configurable: true });
};

const withoutHintsMethod = <T extends { withClientHints: unknown }>({
  withClientHints: _withClientHints,
  ...rest
}: T) => rest;

const loadSupport = async () => {
  let support: typeof import('./support') | undefined;
  jest.isolateModules(() => {
    support = require('./support');
  });
  return support as typeof import('./support');
};

describe('parsedUserAgent client hints', () => {
  afterEach(() => setUserAgentData(undefined));

  it('applies the hints once they resolve', async () => {
    setUserAgentData({
      getHighEntropyValues: () =>
        Promise.resolve({
          mobile: false,
          model: '',
          fullVersionList: [{ brand: 'Google Chrome', version: '130.0.6723.92' }],
        }),
    });
    const { parsedUserAgent } = await loadSupport();
    await parsedUserAgent.withClientHints();
    expect(parsedUserAgent.getBrowser()).toEqual({ name: 'Chrome', version: '130.0.6723.92', major: '130' });
  });

  it('falls back to the user agent string when the hints are refused', async () => {
    setUserAgentData({ getHighEntropyValues: () => Promise.reject(new Error('NotAllowedError')) });
    const { parsedUserAgent } = await loadSupport();
    const before = parsedUserAgent.getResult();
    await expect(parsedUserAgent.withClientHints()).resolves.toEqual(withoutHintsMethod(before));
    expect(parsedUserAgent.getResult()).toEqual(before);
  });

  it('uses the user agent string where the browser has no client hints', async () => {
    const { parsedUserAgent } = await loadSupport();
    const before = parsedUserAgent.getResult();
    await expect(parsedUserAgent.withClientHints()).resolves.toEqual(withoutHintsMethod(before));
  });

  it('keeps withClientHints on getResult for callers of the ua-parser-js 2.x shape', async () => {
    setUserAgentData({
      getHighEntropyValues: () =>
        Promise.resolve({ fullVersionList: [{ brand: 'Google Chrome', version: '130.0.6723.92' }] }),
    });
    const { parsedUserAgent } = await loadSupport();
    const result = await parsedUserAgent.getResult().withClientHints();
    expect(result.browser.version).toBe('130.0.6723.92');
  });
});
