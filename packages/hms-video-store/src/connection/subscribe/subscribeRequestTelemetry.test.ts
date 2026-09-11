import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import { EventBus } from '../../events/EventBus';
import { HMSSimulcastLayer } from '../../interfaces';
import { HMSRemoteStream } from '../../media/streams';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

// fake timers do not advance a worker timer; setTimeout keeps the retry backoff under test control
jest.mock('../../utils/timer-utils', () => ({
  ...jest.requireActual('../../utils/timer-utils'),
  workerSleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}));

type ChannelWithHandler = RTCDataChannel & { onmessage?: (event: { data: string }) => void };

/**
 * A request the SFU never received has no signal anywhere: no SDK event, no SFU metric, and the
 * browser console only reaches us inside a beam's uploaded Chrome log. Both confirmed cases were
 * found by hand from one recording, so we cannot say how often this happens.
 */
describe('a subscribe request the SFU does not answer', () => {
  let connection: HMSSubscribeConnection;
  let stream: HMSRemoteStream;
  let sent: string[];
  let nativeChannel: ChannelWithHandler;
  let eventBus: EventBus;
  let events: string[];

  beforeEach(() => {
    jest.useFakeTimers();
    sent = [];
    events = [];
    window.RTCPeerConnection = jest.fn().mockImplementation(() => ({})) as unknown as typeof RTCPeerConnection;
    const signal = { trickle: jest.fn() } as unknown as JsonRpcSignal;
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    eventBus = new EventBus();
    eventBus.analytics.subscribe(event => events.push(event.name));
    connection = new HMSSubscribeConnection(signal, {}, () => false, observer, eventBus);

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

  /** let the pending microtask chain run without moving the clock */
  const flush = async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }
  };

  /** the 500ms bound on the first attempt of an unproven channel, plus slack */
  const missFirstAttempt = () => jest.advanceTimersByTimeAsync(600);

  /** run out all MAX_RETRIES attempts without ever answering */
  const exhaustRetries = () => jest.advanceTimersByTimeAsync(21_000);

  /**
   * This is the case both RCAs showed - the first request of a session, dropped in the window
   * before the SFU's end of the channel opens. It is rescued by the retry, so it is invisible
   * today; counting it is how we learn whether the rescue is load-bearing.
   */
  it('reports an attempt that went unanswered', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await missFirstAttempt();

    expect(events).toContain('subscribeRequestRetry');
  }, 20_000);

  /** the case the SDK cannot recover from, and the one we have never observed */
  it('reports a request that no attempt answered', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await exhaustRetries();

    expect(events).toContain('subscribeRequestUnanswered');
  }, 20_000);

  /** the rate is only meaningful if an answered request is silent */
  it('reports nothing when the SFU answers', async () => {
    const request = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize');
    await flush();
    respondTo(sent[0]);
    await request;

    expect(events).toEqual([]);
  }, 20_000);
});
