import ISubscribeConnectionObserver from './ISubscribeConnectionObserver';
import HMSSubscribeConnection from './subscribeConnection';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';

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
    connection = new HMSSubscribeConnection({}, signal, observer);

    const nativeChannel = {
      label: API_DATA_CHANNEL,
      readyState: 'open',
      send: (message: string) => sent.push(message),
    } as unknown as RTCDataChannel;
    connection.nativeConnection.ondatachannel?.({ channel: nativeChannel } as RTCDataChannelEvent);
  });

  const respondTo = (request: string) => {
    const { id } = JSON.parse(request);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (connection as any).eventEmitter.emit(
      'message',
      JSON.stringify({ id, jsonrpc: '2.0', result: { track_id: 'track-1' } }),
    );
  };

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
});
