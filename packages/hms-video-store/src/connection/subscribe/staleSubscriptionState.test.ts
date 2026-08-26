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

interface WithEventEmitter {
  eventEmitter: { emit: (event: string, value: string) => void };
}

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

  beforeEach(() => {
    jest.useFakeTimers();
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

    stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const respondTo = (request: string) => {
    const { id } = JSON.parse(request) as { id: string };
    (connection as unknown as WithEventEmitter).eventEmitter.emit(
      'message',
      JSON.stringify({ id, jsonrpc: '2.0', result: { track_id: 'track-1' } }),
    );
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

    // the peer unmutes two seconds later. this is a real change, so it has to go out.
    await jest.advanceTimersByTimeAsync(2000);
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

  it('does not replay a stale layer when the tile resizes mid-flight', async () => {
    const low = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize').catch((e: Error) => e);
    await flush();

    await jest.advanceTimersByTimeAsync(2000);
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
    await jest.advanceTimersByTimeAsync(2000);
    const restored = stream.setAudio(true, 'track-1');
    await flush();
    respondTo(sent[1]);
    await restored;
    await exhaustRetries();

    expect(await silenced).not.toBeInstanceOf(Error);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  /** a request nothing has replaced still has to report failure the way it always did */
  it('still throws when a request that was never replaced runs out of attempts', async () => {
    const failed = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await exhaustRetries();

    expect(await failed).toBeInstanceOf(Error);
  }, 20_000);
});
