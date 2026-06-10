import JsonRpcSignal from '.';

describe('pingPongLoop generation guard on reschedule', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not run a second iteration after id is incremented (close+reopen) on success path', async () => {
    const pingSpy = jest.fn(() => Promise.resolve(10));
    const pingPongLoop = (JsonRpcSignal.prototype as any).pingPongLoop as (this: any, id: number) => Promise<void>;
    const fakeThis: any = {
      isConnected: true,
      id: 1,
      pongResponseTimes: { enqueue: jest.fn() },
      ping: pingSpy,
      setIsConnected: jest.fn(),
      TAG: '[test]',
    };
    fakeThis.pingPongLoop = pingPongLoop.bind(fakeThis);

    await fakeThis.pingPongLoop(1);
    expect(pingSpy).toHaveBeenCalledTimes(1);

    fakeThis.id = 2;
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();

    expect(pingSpy).toHaveBeenCalledTimes(1);
  });
});
