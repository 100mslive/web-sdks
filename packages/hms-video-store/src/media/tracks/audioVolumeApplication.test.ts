import { makeRemoteAudioTrack } from '../../test/helpers/makeRemoteAudioTrack';

/**
 * setVolume does two things: it turns the audio element down, and it applies the subscription state
 * over the api data channel. Only the second is a round trip to the SFU. Making the local half wait
 * on the remote half means a lost reply leaves the peer audible at the volume the user turned off.
 */
describe('audio volume application', () => {
  /** The reported shape: "mute this peer for me" while the SFU is not answering. */
  it('turns the audio element down without waiting for the SFU to answer', async () => {
    const track = makeRemoteAudioTrack({ subscribe: 'hangs' }).track;
    const audioElement = document.createElement('audio');
    track.setAudioElement(audioElement);

    track.setVolume(0).catch(() => undefined);
    await Promise.resolve();

    expect(audioElement.volume).toBe(0);
  });

  /**
   * requestedVolume is kept off the element precisely so it survives the element being torn down
   * and rebuilt - but getVolume read only the element, so during the 500ms rebuild window every
   * syncRoomState recorded volume 0 for a peer at 100, dropping the app's slider to zero.
   */
  it('reports the requested volume while the element is detached', async () => {
    const track = makeRemoteAudioTrack().track;
    track.setAudioElement(document.createElement('audio'));
    await track.setVolume(40);

    track.setAudioElement(null);

    expect(track.getVolume()).toBe(40);
  });

  it('still applies the volume when the subscribe round trip resolves normally', async () => {
    const track = makeRemoteAudioTrack().track;
    const audioElement = document.createElement('audio');
    track.setAudioElement(audioElement);

    // silence first, so turning it back up is a real resubscribe rather than a no-op
    await track.setVolume(0);
    await track.setVolume(40);

    expect(audioElement.volume).toBeCloseTo(0.4);
  });
});
