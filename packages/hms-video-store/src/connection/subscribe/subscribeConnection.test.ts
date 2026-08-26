import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

// the retry backoff sleeps on a worker timer, which fake timers do not advance
jest.mock('../../utils/timer-utils', () => ({
  ...jest.requireActual('../../utils/timer-utils'),
  workerSleep: jest.fn(() => Promise.resolve()),
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
    window.RTCPeerConnection = jest.fn().mockImplementation(() => ({
      close: jest.fn(),
      getSenders: () => [],
    })) as unknown as typeof RTCPeerConnection;
    const signal = { trickle: jest.fn() } as unknown as JsonRpcSignal;
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    connection = new HMSSubscribeConnection(signal, {}, () => false, observer);

    const nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => sent.push(message),
      close: jest.fn(),
    } as unknown as RTCDataChannel;
    connection.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);
  });

  // a test that throws before its inline useRealTimers() would leak fake timers into the next one
  afterEach(() => {
    jest.useRealTimers();
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

  /**
   * The retry loop exits on the last attempt without re-examining `response`, so an error that was
   * only retryable-until-attempts-ran-out is handed back as the resolved value. No caller inspects
   * `error` on a resolved response, so a track the SFU refused reads as a track it applied.
   */
  it('throws rather than returning a retryable error that arrived on the final attempt', async () => {
    jest.useFakeTimers();
    const promise = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    // every attempt gets the same retryable error, including the last one
    for (let attempt = 0; attempt < 3; attempt++) {
      await jest.advanceTimersByTimeAsync(10);
      emitReply(sent[attempt], { error: { code: 500, message: 'internal' } });
    }
    await jest.advanceTimersByTimeAsync(10);

    expect(sent).toHaveLength(3);
    await expect(promise).resolves.toBeInstanceOf(Error);
  }, 10_000);

  /**
   * `error.code / 100 === 5` is exact division, so it is true only for 500 - a 503 from an SFU
   * restarting is classified non-retryable and throws on the first attempt with no retry at all.
   */
  it('retries a 503 the same way it retries a 500', async () => {
    jest.useFakeTimers();
    const promise = connection.sendOverApiDataChannelWithResponse({
      method: 'prefer-audio-track-state',
      params: { subscribed: true, track_id: 'track-1' },
    });

    await jest.advanceTimersByTimeAsync(10);
    emitReply(sent[0], { error: { code: 503, message: 'service unavailable' } });
    await jest.advanceTimersByTimeAsync(10);

    expect(sent).toHaveLength(2);
    respondTo(sent[1]);
    await expect(promise).resolves.toMatchObject({ result: { track_id: 'track-1' } });
  }, 10_000);

  /**
   * The claim is checked before the open wait but not after it. A request that lost the claim while
   * parked still reaches `send`, putting desired state the caller has moved on from on the wire -
   * for `prefer-audio-track-state` that is an audible unsubscribe the user never asked for.
   */
  it('does not send a request that was superseded while waiting for the channel to open', async () => {
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    const pending = new HMSSubscribeConnection(
      { trickle: jest.fn() } as unknown as JsonRpcSignal,
      {},
      () => false,
      observer,
    );
    const pendingSent: string[] = [];
    const nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => pendingSent.push(message),
    } as unknown as RTCDataChannel;

    jest.useFakeTimers();
    // both park on the closed channel; the second claims the state the first was going to write
    const stale = pending
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: false, track_id: 'track-1' },
      })
      .catch((error: Error) => error);
    const latest = pending
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    pending.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);
    nativeChannel.onopen?.(new Event('open'));
    await jest.advanceTimersByTimeAsync(100);

    expect(pendingSent.map(message => JSON.parse(message).params.subscribed)).toEqual([true]);

    const { id } = JSON.parse(pendingSent[0]) as { id: string };
    (pending as unknown as WithEventEmitter).eventEmitter.emit(
      'message',
      JSON.stringify({ id, jsonrpc: '2.0', result: { track_id: 'track-1' } }),
    );
    await Promise.all([stale, latest]);
  }, 10_000);

  /**
   * close() shuts the channel but leaves the retry loops running against it, so every pending
   * request keeps burning its full retry budget on a connection that is gone - on leave or an SFU
   * migration that is a minute of work per track after nobody is listening.
   */
  it('settles pending requests when the connection is closed', async () => {
    jest.useFakeTimers();
    let settled = false;
    const promise = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error)
      .then(value => {
        settled = true;
        return value;
      });

    await jest.advanceTimersByTimeAsync(100);
    expect(settled).toBe(false);

    connection.close();
    await jest.advanceTimersByTimeAsync(100);

    expect(settled).toBe(true);
    // rejects rather than resolving: a caller that reads a torn-down connection as success keeps
    // believing the SFU applied state it never received
    await expect(promise).resolves.toBeInstanceOf(Error);
  }, 10_000);

  /** the backoff before an attempt that will never happen only delays the throw */
  it('does not sleep out a retry backoff after the final attempt', async () => {
    jest.useFakeTimers();
    const workerSleep = jest.requireMock('../../utils/timer-utils').workerSleep as jest.Mock;
    workerSleep.mockClear();

    const promise = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    for (let attempt = 0; attempt < 3; attempt++) {
      await jest.advanceTimersByTimeAsync(10);
      emitReply(sent[attempt], { error: { code: 500, message: 'internal' } });
    }
    await jest.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toBeInstanceOf(Error);
    // one backoff between attempt 1->2 and one between 2->3, none after the last
    expect(workerSleep).toHaveBeenCalledTimes(2);
  }, 10_000);

  /**
   * A reply the SFU actually sent is the outcome, whatever happened to the claim while it was in
   * flight. Callers read the response - requestLayer hands it back to addSink's on-demand branch -
   * so discarding a successful one reports a request the SFU applied as dropped.
   */
  it('returns a response that arrived even if a newer request claimed the state meanwhile', async () => {
    const first = connection.sendOverApiDataChannelWithResponse({
      method: 'prefer-video-track-state',
      params: { max_spatial_layer: 'high', track_id: 'track-1' },
    });
    await Promise.resolve();
    // a newer request for the same track takes the claim while the first reply is in flight
    connection.sendOverApiDataChannelWithResponse({
      method: 'prefer-video-track-state',
      params: { max_spatial_layer: 'low', track_id: 'track-1' },
    });
    await Promise.resolve();
    emitReply(sent[0], { result: { track_id: 'track-1' } });

    await expect(first).resolves.toMatchObject({ result: { track_id: 'track-1' } });
  });

  /**
   * Leave and SFU migration both close the connection with superseded requests still parked. Those
   * are not failures - reporting them as one puts an error in the log on every normal leave.
   */
  it('drops a superseded request on close rather than reporting it as a failure', async () => {
    jest.useFakeTimers();
    const stale = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: false, track_id: 'track-1' },
      })
      .catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(10);
    const latest = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-audio-track-state',
        params: { subscribed: true, track_id: 'track-1' },
      })
      .catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(10);

    connection.close();
    await jest.advanceTimersByTimeAsync(100);

    await expect(stale).resolves.not.toBeInstanceOf(Error);
    await expect(latest).resolves.toBeInstanceOf(Error);
  }, 10_000);

  /**
   * The retryable-error-exhausted exit has to agree with the others: a request the newer one took
   * over is not a failure, so it drops rather than throwing. Reaching that exit needs the claim to
   * change hands during the *final* attempt - any earlier and the loop-top check drops it first.
   */
  it('drops rather than throwing when a superseded request exhausts its retries on an error', async () => {
    jest.useFakeTimers();
    const stale = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-video-track-state',
        params: { max_spatial_layer: 'high', track_id: 'track-1' },
      })
      .catch((error: Error) => error);

    // burn the first two attempts while this request still owns the claim
    for (let attempt = 0; attempt < 2; attempt++) {
      await jest.advanceTimersByTimeAsync(10);
      emitReply(sent[attempt], { error: { code: 500, message: 'internal' } });
    }
    await jest.advanceTimersByTimeAsync(10);
    expect(sent).toHaveLength(3);

    // the third attempt is now in flight; a newer request takes the claim, then the 500 lands
    const latest = connection
      .sendOverApiDataChannelWithResponse({
        method: 'prefer-video-track-state',
        params: { max_spatial_layer: 'low', track_id: 'track-1' },
      })
      .catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(10);
    emitReply(sent[2], { error: { code: 500, message: 'internal' } });
    await jest.advanceTimersByTimeAsync(120_000);

    await expect(stale).resolves.not.toBeInstanceOf(Error);
    await latest;
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
