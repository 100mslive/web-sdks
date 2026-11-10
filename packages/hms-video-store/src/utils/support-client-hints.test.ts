const setUserAgentData = (userAgentData?: { getHighEntropyValues: () => Promise<unknown> }) => {
  Object.defineProperty(navigator, 'userAgentData', { value: userAgentData, configurable: true });
};

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
    await expect(parsedUserAgent.withClientHints()).resolves.toBe(before);
    expect(parsedUserAgent.getResult()).toBe(before);
  });

  it('uses the user agent string where the browser has no client hints', async () => {
    const { parsedUserAgent } = await loadSupport();
    const before = parsedUserAgent.getResult();
    await expect(parsedUserAgent.withClientHints()).resolves.toBe(before);
  });
});
