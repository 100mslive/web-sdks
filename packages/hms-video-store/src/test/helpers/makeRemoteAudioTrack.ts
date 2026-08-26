import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSRemoteStream } from '../../media/streams';
import { HMSRemoteAudioTrack } from '../../media/tracks';

/** 'hangs' is a lost reply; 'rejects' is one the retry budget gave up on */
export type SubscribeOutcome = 'resolves' | 'rejects' | 'hangs';

interface Options {
  subscribe?: SubscribeOutcome;
  id?: string;
}

const subscribeImpl = (outcome: SubscribeOutcome) => {
  if (outcome === 'resolves') {
    return jest.fn().mockResolvedValue({});
  }
  if (outcome === 'rejects') {
    return jest.fn().mockRejectedValue(new Error('No response from SFU'));
  }
  return jest.fn(() => new Promise(() => undefined));
};

/**
 * A real HMSRemoteAudioTrack over a fake subscribe connection, so setVolume's own ordering runs
 * rather than a stub's resolved promise. `send` is exposed for asserting what reached the SFU.
 */
export const makeRemoteAudioTrack = ({ subscribe = 'resolves', id = 'track-1' }: Options = {}) => {
  const send = subscribeImpl(subscribe);
  const connection = { sendOverApiDataChannelWithResponse: send } as unknown as HMSSubscribeConnection;
  const stream = new HMSRemoteStream({ id: `stream-${id}` } as MediaStream, connection);
  const nativeTrack = { id, kind: 'audio', enabled: true, addEventListener: jest.fn() } as unknown as MediaStreamTrack;
  const track = new HMSRemoteAudioTrack(stream, nativeTrack, 'regular');
  return { track, stream, send };
};
