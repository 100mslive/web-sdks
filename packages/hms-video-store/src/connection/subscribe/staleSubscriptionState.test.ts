import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';
import { HMSRemoteStream } from '../../media/streams';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

// the retry backoff sleeps on a worker timer, which fake timers do not advance
jest.mock('../../utils/timer-utils', () => ({
  ...jest.requireActual('../../utils/timer-utils'),
  workerSleep: () => Promise.resolve(),
}));

/** the connection reads replies off the native channel, so replies in tests arrive the same way */
type ChannelWithHandler = RTCDataChannel & { onmessage?: (event: { data: string }) => void };

/**
 * A retry replays the bytes serialised when the request was made. Without a claim on the state it
 * is setting, a request still retrying after the caller has moved on puts the older value back:
 * the peer unmutes but goes silent again ten seconds later, or the tile resizes and snaps back to
 * the layer it had. Nothing surfaces either, because most of these calls are fire-and-forget.
 */
describe('a request that a newer one has replaced', () => {
  let connection: HMSSubscribeConnection;
  let stream: HMSRemoteStream;
  let sent: string[];
  let nativeChannel: ChannelWithHandler;

  beforeEach(() => {
    jest.useFakeTimers();
    sent = [];
    window.RTCPeerConnection = jest.fn().mockImplementation(() => ({})) as unknown as typeof RTCPeerConnection;
    const signal = { trickle: jest.fn() } as unknown as JsonRpcSignal;
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    connection = new HMSSubscribeConnection(signal, {}, () => false, observer);

    nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => sent.push(message),
    } as unknown as ChannelWithHandler;
    connection.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);

    stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const respondTo = (request: string) => {
    const { id } = JSON.parse(request) as { id: string };
    nativeChannel.onmessage?.({ data: JSON.stringify({ id, jsonrpc: '2.0', result: { track_id: 'track-1' } }) });
  };

  const respondWithError = (request: string) => {
    const { id } = JSON.parse(request) as { id: string };
    nativeChannel.onmessage?.({
      data: JSON.stringify({ id, jsonrpc: '2.0', error: { code: 400, message: 'bad request' } }),
    });
  };

  const paramsOf = (request: string) => (JSON.parse(request) as { params: Record<string, unknown> }).params;
  const subscribedOf = (request: string) => paramsOf(request).subscribed as boolean;
  const layerOf = (request: string) => paramsOf(request).max_spatial_layer as HMSSimulcastLayer;

  /** let the pending microtask chain run without moving the clock */
  const flush = async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }
  };

  /** run out all MAX_RETRIES attempts without ever answering */
  const exhaustRetries = () => jest.advanceTimersByTimeAsync(60_000);

  it('does not replay the stale unsubscribe when the peer unmutes mid-flight', async () => {
    const silenced = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();

    // the peer unmutes while the first request is still on its first attempt - this is a real
    // change, so it has to go out. Later than one attempt is the same case with retries in front.
    await jest.advanceTimersByTimeAsync(200);
    const restored = stream.setAudio(true, 'track-1');
    await flush();
    respondTo(sent[1]);
    await restored;

    // the first request's timeout fires - and must not put its stale bytes back on the wire
    await exhaustRetries();
    await silenced;

    expect(sent.map(subscribedOf)).toEqual([false, true]);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  /**
   * The first attempt is not the only window that matters - a request that has already replayed its
   * bytes once is the one most likely to still be retrying when the caller moves on.
   */
  it('does not replay the stale unsubscribe once a retry is already in flight', async () => {
    const silenced = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();

    // the first attempt gives up on the unproven channel and replays the same bytes
    await jest.advanceTimersByTimeAsync(600);
    expect(sent).toHaveLength(2);

    const restored = stream.setAudio(true, 'track-1');
    await flush();
    respondTo(sent[2]);
    await restored;

    await exhaustRetries();
    await silenced;

    expect(sent.map(subscribedOf)).toEqual([false, false, true]);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  it('does not replay a stale layer when the tile resizes mid-flight', async () => {
    const low = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize').catch((e: Error) => e);
    await flush();

    await jest.advanceTimersByTimeAsync(200);
    const high = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize');
    await flush();
    respondTo(sent[1]);
    await high;

    await exhaustRetries();
    await low;

    expect(sent.map(layerOf)).toEqual([HMSSimulcastLayer.LOW, HMSSimulcastLayer.HIGH]);
    expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.HIGH);
  }, 20_000);

  /** each track claims its own state, so one track's churn must not cancel another's request */
  it('does not cancel a request for a different track', async () => {
    const first = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize');
    await flush();
    const other = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-2', 'id', 'resize');
    await flush();

    expect(sent).toHaveLength(2);
    respondTo(sent[0]);
    respondTo(sent[1]);

    await expect(first).resolves.toBeDefined();
    await expect(other).resolves.toBeDefined();
  }, 20_000);

  /**
   * Being replaced is not a failure - the newer request owns the outcome. Reporting an error would
   * surface as a rejection an app cannot act on, and would log at error on the paths that only
   * discard the promise. So it resolves, and it must not disturb the newer value on the way out.
   */
  it('resolves rather than failing, and leaves the newer value in place', async () => {
    const silenced = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();
    await jest.advanceTimersByTimeAsync(200);
    const restored = stream.setAudio(true, 'track-1');
    await flush();
    respondTo(sent[1]);
    await restored;
    await exhaustRetries();

    expect(await silenced).not.toBeInstanceOf(Error);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  /**
   * The SFU answering with a non-retryable code is the third way out of the retry loop, and it has
   * to agree with the other two - a request that has already been replaced does not report failure
   * on this path either.
   */
  it('does not report failure on a non-retryable error once it has been replaced', async () => {
    const silenced = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();

    const restored = stream.setAudio(true, 'track-1');
    await flush();
    respondTo(sent[1]);
    await restored;

    // the replaced request's own answer finally arrives, carrying a code it would never retry
    respondWithError(sent[0]);

    expect(await silenced).not.toBeInstanceOf(Error);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  /** a request nothing has replaced still has to report failure the way it always did */
  it('still throws when a request that was never replaced runs out of attempts', async () => {
    const failed = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await exhaustRetries();

    expect(await failed).toBeInstanceOf(Error);
  }, 20_000);

  /** and a non-retryable error on a request nothing replaced still rejects */
  it('still throws on a non-retryable error when nothing replaced the request', async () => {
    const failed = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();

    respondWithError(sent[0]);

    expect(await failed).toBeInstanceOf(Error);
  }, 20_000);

  /**
   * Supersession normally answers this, but a replaced request can still receive a real success -
   * sendMessage returns a response the SFU actually sent whatever happened to the claim. If that
   * reply lands after the newer one, confirming it records a layer the SFU has already moved off.
   */
  it('does not let a late reply for a replaced request confirm its layer', async () => {
    const high = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch((e: Error) => e);
    await flush();
    const low = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize');
    await flush();

    // the newer request is answered first, then the replaced one's own reply arrives
    respondTo(sent[1]);
    await low;
    respondTo(sent[0]);
    await high;

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.LOW)).toBe(true);
    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(false);
  }, 20_000);

  /** the SFU telling us where it is outranks a request still on the wire */
  it('lets a layer pushed by the SFU settle the dedupe while a request is in flight', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await flush();

    stream.setVideoLayerFromServer(HMSSimulcastLayer.LOW, 'id', 'degradation');

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.LOW)).toBe(true);
  }, 20_000);
});
