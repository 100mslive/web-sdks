import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSRemoteStream } from '../streams';
import { HMSRemoteAudioTrack } from '../tracks';

/**
 * setVolume(0) is how "mute for you" silences a peer - it unsubscribes from their audio rather
 * than only turning the element down. The peer muting and unmuting their own mic runs setEnabled,
 * which resubscribes, so without a check there the peer comes back audible while the app still
 * shows them silenced.
 */
describe('HMSRemoteAudioTrack silenced with setVolume(0)', () => {
  let track: HMSRemoteAudioTrack;
  let stream: HMSRemoteStream;
  let audioElement: HTMLAudioElement;

  beforeEach(() => {
    audioElement = document.createElement('audio');
    const connection = {
      sendOverApiDataChannelWithResponse: jest.fn().mockResolvedValue({}),
    } as unknown as HMSSubscribeConnection;
    stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
    const nativeTrack = {
      id: 'track-1',
      kind: 'audio',
      enabled: true,
      addEventListener: jest.fn(),
    } as unknown as MediaStreamTrack;
    track = new HMSRemoteAudioTrack(stream, nativeTrack, 'regular');
    track.setAudioElement(audioElement);
  });

  /** The reported bug: silenced, peer toggles their mic, audio is back. */
  it('stays unsubscribed when the peer mutes and unmutes', async () => {
    await track.setVolume(0);
    expect(stream.isAudioSubscribed()).toBe(false);

    await track.setEnabled(false);
    await track.setEnabled(true);

    expect(stream.isAudioSubscribed()).toBe(false);
  });

  /** A peer who was never silenced has to come back audible, otherwise unmute is broken. */
  it('resubscribes when the peer unmutes and was not silenced', async () => {
    await track.setVolume(50);

    await track.setEnabled(false);
    await track.setEnabled(true);

    expect(stream.isAudioSubscribed()).toBe(true);
  });

  /** Raising the volume again clears it - the next unmute has to be audible. */
  it('resubscribes once the volume is turned back up', async () => {
    await track.setVolume(0);
    await track.setVolume(100);
    expect(stream.isAudioSubscribed()).toBe(true);

    await track.setEnabled(false);
    await track.setEnabled(true);

    expect(stream.isAudioSubscribed()).toBe(true);
  });

  /** Silencing while the peer is already muted is the exact repro path that was reported. */
  it('stays unsubscribed when silenced while the peer is already muted', async () => {
    await track.setEnabled(false);
    await track.setVolume(0);

    await track.setEnabled(true);

    expect(stream.isAudioSubscribed()).toBe(false);
  });
});
