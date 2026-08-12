import { parsedUserAgent } from './support';

const setTouchPoints = (maxTouchPoints: number) => {
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true });
};

const mockUserAgent = (device: { type?: string }, os: { name?: string }) => {
  jest.spyOn(parsedUserAgent, 'getDevice').mockReturnValue(device as ReturnType<typeof parsedUserAgent.getDevice>);
  jest.spyOn(parsedUserAgent, 'getOS').mockReturnValue(os as ReturnType<typeof parsedUserAgent.getOS>);
};

describe('isMobileOrTablet', () => {
  // required so the spies above are in place before the module reads them
  let isMobileOrTablet: () => boolean;

  beforeEach(async () => {
    jest.restoreAllMocks();
    setTouchPoints(0);
    ({ isMobileOrTablet } = await import('./support'));
  });

  it('is true for a phone', () => {
    mockUserAgent({ type: 'mobile' }, { name: 'iOS' });
    expect(isMobileOrTablet()).toBe(true);
  });

  it('is true for a tablet', () => {
    mockUserAgent({ type: 'tablet' }, { name: 'Android' });
    expect(isMobileOrTablet()).toBe(true);
  });

  /**
   * The case a device-type check alone misses: iPadOS 13+ safari sends a desktop class user agent,
   * so it parses as a mac with no device type at all.
   */
  it('is true for iPadOS reporting itself as a mac', () => {
    mockUserAgent({ type: undefined }, { name: 'Mac OS' });
    setTouchPoints(5);
    expect(isMobileOrTablet()).toBe(true);
  });

  it('is false for a real mac', () => {
    mockUserAgent({ type: undefined }, { name: 'Mac OS' });
    setTouchPoints(0);
    expect(isMobileOrTablet()).toBe(false);
  });

  it('is false for a windows desktop', () => {
    mockUserAgent({ type: undefined }, { name: 'Windows' });
    expect(isMobileOrTablet()).toBe(false);
  });
});
