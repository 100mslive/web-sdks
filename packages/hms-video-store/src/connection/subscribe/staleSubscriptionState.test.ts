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
 * `audio` and `video` are written before the SFU confirms them, because they are what dedupes the
 * next call. That leaves two ways for the client's idea of the subscription to drift from the
 * SFU's: a retry replaying bytes the caller has moved on from, and a request that never lands at
 * all leaving the field flipped so every later attempt is deduped away. Both end the same way -
 * the peer is silent or the tile is blank, and nothing in the app reflects it.
 */
describe('subscription state when a request does not land', () => {
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

  describe('a newer request supersedes an older one', () => {
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

    /**
     * Being replaced is not a failure - the newer request owns the outcome. Reporting an error
     * would surface as a rejection an app cannot act on, and would log at error on the paths that
     * only discard the promise. So it resolves, and it must not undo the newer value on the way.
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
  });

  describe('a request the SFU never confirms', () => {
    it('rolls the subscription back so the next attempt is not deduped away', async () => {
      const failed = stream.setAudio(false, 'track-1').catch((error: Error) => error);
      await exhaustRetries();

      expect(await failed).toBeInstanceOf(Error);
      // the SFU never heard it, so the client must not believe it is unsubscribed
      expect(stream.isAudioSubscribed()).toBe(true);

      // the app tries again - this has to reach the wire, which it cannot if the field stayed false
      const sentBefore = sent.length;
      const retried = stream.setAudio(false, 'track-1');
      await flush();
      expect(sent.length).toBeGreaterThan(sentBefore);
      respondTo(sent[sent.length - 1]);
      await retried;
      expect(stream.isAudioSubscribed()).toBe(false);
    }, 20_000);

    it('rolls the layer back so the next request is not deduped away', async () => {
      await (async () => {
        const first = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'addSink');
        await flush();
        respondTo(sent[0]);
        await first;
      })();
      expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.HIGH);

      const failed = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize').catch((e: Error) => e);
      await exhaustRetries();

      expect(await failed).toBeInstanceOf(Error);
      expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.HIGH);

      const sentBefore = sent.length;
      const retried = stream.setVideoLayer(HMSSimulcastLayer.LOW, 'track-1', 'id', 'resize');
      await flush();
      expect(sent.length).toBeGreaterThan(sentBefore);
      respondTo(sent[sent.length - 1]);
      await retried;
      expect(stream.getVideoLayer()).toBe(HMSSimulcastLayer.LOW);
    }, 20_000);
  });

  /** the naive fix - deferring the write until the SFU confirms - breaks exactly this */
  it('still sends a genuine change made while an earlier request is in flight', async () => {
    const silenced = stream.setAudio(false, 'track-1').catch((error: Error) => error);
    await flush();

    await jest.advanceTimersByTimeAsync(2000);
    const restored = stream.setAudio(true, 'track-1');
    await flush();

    expect(sent.map(subscribedOf)).toEqual([false, true]);
    respondTo(sent[1]);
    await restored;
    await exhaustRetries();
    await silenced;
  }, 20_000);
});
