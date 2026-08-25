import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

// the retry backoff sleeps on a worker timer, which fake timers do not advance
jest.mock('../../utils/timer-utils', () => ({
  ...jest.requireActual('../../utils/timer-utils'),
  workerSleep: () => Promise.resolve(),
}));

interface WithEventEmitter {
  eventEmitter: { emit: (event: string, value: string) => void };
}

/**
 * The Aug 2026 silent-recording incident: the SFU never answered the first
 * `prefer-audio-track-state` request of a session, so the caller waited forever.
 */
describe('HMSSubscribeConnection api data channel', () => {
  let connection: HMSSubscribeConnection;
  let sent: string[];

  beforeEach(() => {
    sent = [];
    window.RTCPeerConnection = jest.fn().mockImplementation(() => ({})) as unknown as typeof RTCPeerConnection;
    const signal = { trickle: jest.fn() } as unknown as JsonRpcSignal;
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    connection = new HMSSubscribeConnection(signal, {}, () => false, observer);

    const nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => sent.push(message),
    } as unknown as RTCDataChannel;
    connection.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);
  });

  /** the emitter is private; the data channel's onMessage feeds it exactly like this */
  const emitReply = (request: string, body: Record<string, unknown>) => {
    const { id } = JSON.parse(request) as { id: string };
    (connection as unknown as WithEventEmitter).eventEmitter.emit(
      'message',
      JSON.stringify({ id, jsonrpc: '2.0', ...body }),
    );
  };

  const respondTo = (request: string) => emitReply(request, { result: { track_id: 'track-1' } });

  it('resolves when the SFU answers', async () => {
    const promise = connection.sendOverApiDataChannelWithResponse({
      method: 'prefer-audio-track-state',
      params: { subscribed: true, track_id: 'track-1' },
    });
    await Promise.resolve();
    respondTo(sent[0]);

    await expect(promise).resolves.toBeDefined();
  });

  it('settles instead of hanging when the SFU never answers', async () => {
    jest.useFakeTimers();
    const promise = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    await jest.advanceTimersByTimeAsync(120_000);
    const result = await promise;

    expect(result).toBeInstanceOf(Error);
    jest.useRealTimers();
  }, 10_000);

  /**
   * A retryable error on an early attempt must not be reported as the outcome when the later
   * attempts time out - callers do not inspect `error` on the resolved value, so returning it
   * reads as success.
   */
  it('throws rather than returning an earlier error response when later attempts time out', async () => {
    jest.useFakeTimers();
    const promise = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    await Promise.resolve();
    emitReply(sent[0], { error: { code: 429, message: 'too many requests' } });

    await jest.advanceTimersByTimeAsync(120_000);
    const result = await promise;

    expect(result).toBeInstanceOf(Error);
    jest.useRealTimers();
  }, 10_000);

  /**
   * If the data channel never opens - the connection was torn down, or replaced by a new
   * HMSSubscribeConnection that owns the next channel - the old emitter never fires 'open' again.
   * An unbounded wait there hangs the caller for the rest of the session just as a lost reply did.
   */
  it('settles instead of hanging when the data channel never opens', async () => {
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    const neverOpen = new HMSSubscribeConnection(
      { trickle: jest.fn() } as unknown as JsonRpcSignal,
      {},
      () => false,
      observer,
    );

    jest.useFakeTimers();
    const promise = neverOpen
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    await jest.advanceTimersByTimeAsync(180_000);
    const result = await promise;

    expect(result).toBeInstanceOf(Error);
    jest.useRealTimers();
  }, 10_000);

  /** a channel that opens after the first attempt gave up should still get the request through */
  it('recovers on a later attempt when the channel opens late', async () => {
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    const late = new HMSSubscribeConnection(
      { trickle: jest.fn() } as unknown as JsonRpcSignal,
      {},
      () => false,
      observer,
    );
    const lateSent: string[] = [];
    const nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => lateSent.push(message),
    } as unknown as RTCDataChannel;

    jest.useFakeTimers();
    const promise = late.sendOverApiDataChannelWithResponse({
      method: 'prefer-audio-track-state',
      params: { subscribed: true, track_id: 'track-1' },
    });

    // let the first attempt's open wait expire
    await jest.advanceTimersByTimeAsync(11_000);
    expect(lateSent).toHaveLength(0);

    late.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);
    nativeChannel.onopen?.(new Event('open'));
    await jest.advanceTimersByTimeAsync(100);

    const { id } = JSON.parse(lateSent[0]) as { id: string };
    (late as unknown as WithEventEmitter).eventEmitter.emit(
      'message',
      JSON.stringify({ id, jsonrpc: '2.0', result: { track_id: 'track-1' } }),
    );

    await expect(promise).resolves.toBeDefined();
    jest.useRealTimers();
  }, 10_000);
});
