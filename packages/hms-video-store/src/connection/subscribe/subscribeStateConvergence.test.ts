import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import { EventBus } from '../../events/EventBus';
import { HMSSimulcastLayer } from '../../interfaces';
import { HMSRemoteStream } from '../../media/streams';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

// fake timers do not advance a worker timer; setTimeout puts the re-drive delay under the test's
// control, which is what lets a re-drive be parked while something else happens
jest.mock('../../utils/timer-utils', () => ({
  ...jest.requireActual('../../utils/timer-utils'),
  workerSleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}));

type ChannelWithHandler = RTCDataChannel & { onmessage?: (event: { data: string }) => void };

/**
 * Running out of attempts leaves the SFU on a state nobody asked for. Nothing re-sends on its own:
 * video waits on a resize or a sink change, and audio has no trigger at all short of a mute, so a
 * remote peer can stay silent for the rest of the session.
 */
describe('a request that ran out of attempts', () => {
  let connection: HMSSubscribeConnection;
  let stream: HMSRemoteStream;
  let sent: string[];
  let nativeChannel: ChannelWithHandler;
  let eventBus: EventBus;

  beforeEach(() => {
    jest.useFakeTimers();
    sent = [];
    window.RTCPeerConnection = jest
      .fn()
      .mockImplementation(() => ({ close: jest.fn() })) as unknown as typeof RTCPeerConnection;
    const signal = { trickle: jest.fn() } as unknown as JsonRpcSignal;
    const observer = { onApiChannelMessage: jest.fn() } as unknown as ISubscribeConnectionObserver;
    eventBus = new EventBus();
    connection = new HMSSubscribeConnection(signal, {}, () => false, observer, eventBus);

    nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => sent.push(message),
      close: jest.fn(),
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

  const respondWithError = (request: string, code: number) => {
    const { id } = JSON.parse(request) as { id: string };
    nativeChannel.onmessage?.({
      data: JSON.stringify({ id, jsonrpc: '2.0', error: { code, message: 'track not found' } }),
    });
  };

  const paramsOf = (request: string) => (JSON.parse(request) as { params: Record<string, unknown> }).params;
  const layerOf = (request: string) => paramsOf(request).max_spatial_layer as HMSSimulcastLayer;
  const subscribedOf = (request: string) => paramsOf(request).subscribed as boolean;
  const idOf = (request: string) => (JSON.parse(request) as { id: string }).id;

  /** a retry replays the original id, so a fresh id is a request the stream raised itself */
  const firstRedrive = () => sent.find(request => idOf(request) !== idOf(sent[0]));

  /** let the pending microtask chain run without moving the clock */
  const flush = async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }
  };

  const RECONVERGE_ATTEMPTS = 3;

  /** run out all MAX_RETRIES attempts without ever answering; leaves a re-drive parked on its delay */
  const exhaustRetries = () => jest.advanceTimersByTimeAsync(21_000);

  /** release the parked re-drive - the first delay in RECONVERGE_DELAYS */
  const releaseRedrive = () => jest.advanceTimersByTimeAsync(1_000);

  it('re-drives the layer the SFU never applied', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await exhaustRetries();
    await releaseRedrive();

    // no resize and no sink change here - the re-send has to come from the stream itself
    const redrive = firstRedrive();
    expect(redrive).toBeDefined();
    expect(layerOf(redrive!)).toBe(HMSSimulcastLayer.HIGH);

    respondTo(redrive!);
    await flush();

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(true);
  }, 20_000);

  /** a tile at least gets a resize eventually; nothing resizes an audio track */
  it('re-drives an audio subscribe the SFU never applied', async () => {
    stream.setAudio(false, 'track-1').catch(() => undefined);
    await exhaustRetries();
    await releaseRedrive();

    const redrive = firstRedrive();
    expect(redrive).toBeDefined();
    expect(subscribedOf(redrive!)).toBe(false);
  }, 20_000);

  /** a channel that is wedged rather than racing must not be re-driven for the rest of the session */
  it('gives up rather than re-driving forever', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await jest.advanceTimersByTimeAsync(10 * 60_000);

    const requests = new Set(sent.map(idOf));
    expect(requests.size).toBe(1 + RECONVERGE_ATTEMPTS);
  }, 20_000);

  /**
   * A re-drive chases the current desired state, so a newer request reaching the SFU is what ends
   * the chase. Without that check the pending re-drive re-sends a state the SFU is already on.
   */
  it('sends nothing more once the SFU is on the desired state', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await exhaustRetries();

    // the app asks again and the SFU answers while the re-drive is still parked on its delay
    const again = stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize');
    await flush();
    respondTo(sent[sent.length - 1]);
    await again;
    const settled = sent.length;

    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(sent).toHaveLength(settled);
  }, 20_000);

  /** giving up silently is how this went unnoticed in the first place */
  it('reports the state it could not reach when it gives up', async () => {
    const events: string[] = [];
    eventBus.analytics.subscribe(event => events.push(event.name));

    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(events).toContain('subscribeStateStuck');
  }, 20_000);

  /** a leave parks one re-drive per track; each one waking to send on a dead channel is noise */
  it('stops re-driving once the connection closes', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await exhaustRetries();

    connection.close();
    const atClose = sent.length;

    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(sent).toHaveLength(atClose);
  }, 20_000);

  /**
   * The app reversing itself is the other way desired state moves. The SFU never applied the mute,
   * so it is already where the app now wants it - and a re-drive chasing the mute would silence a
   * peer the app has explicitly unmuted.
   */
  it('does not re-drive a value the app has since reversed', async () => {
    stream.setAudio(false, 'track-1').catch(() => undefined);
    await exhaustRetries();

    await stream.setAudio(true, 'track-1');
    const settled = sent.length;

    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(sent.slice(settled).map(subscribedOf)).not.toContain(false);
    expect(stream.isAudioSubscribed()).toBe(true);
  }, 20_000);

  /** a 404 is the SFU refusing the request, not applying it - confirming it would dedupe forever */
  it('does not treat an error reply as the SFU applying the layer', async () => {
    stream.setVideoLayer(HMSSimulcastLayer.HIGH, 'track-1', 'id', 'resize').catch(() => undefined);
    await flush();

    respondWithError(sent[0], 404);
    await flush();

    expect(stream.isVideoLayerSettled(HMSSimulcastLayer.HIGH)).toBe(false);
  }, 20_000);
});
