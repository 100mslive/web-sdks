import { Store } from './index';
import { AudioSinkManager } from '../../audio-sink-manager/AudioSinkManager';
import { DeviceManager } from '../../device-manager';
import { EventBus } from '../../events/EventBus';
import { makeRemoteAudioTrack, SubscribeOutcome } from '../../test/helpers/makeRemoteAudioTrack';

/**
 * A global volume change fans out one subscribe request per remote audio track. Running them in
 * series and letting the first rejection out of the loop means one unanswered request leaves every
 * track after it in the list untouched - and, because the sink manager records the new volume only
 * once the whole loop returns, every track added later gets the old volume too.
 */
describe('Store.updateAudioOutputVolume', () => {
  let store: Store;

  const addTrackWith = (id: string, subscribe: SubscribeOutcome) => {
    const { track } = makeRemoteAudioTrack({ id, subscribe });
    track.setAudioElement(document.createElement('audio'));
    store.addTrack(track);
    return track;
  };

  beforeEach(() => {
    store = new Store();
  });

  it('applies the volume to the tracks after one whose request fails', async () => {
    addTrackWith('first', 'resolves');
    addTrackWith('unanswered', 'rejects');
    const last = addTrackWith('last', 'resolves');

    await expect(store.updateAudioOutputVolume(0)).resolves.toBeUndefined();

    expect(last.getVolume()).toBe(0);
  });

  it('records the new volume on the sink manager even when a track fails', async () => {
    const eventBus = new EventBus();
    const audioSinkManager = new AudioSinkManager(
      store,
      { outputDevice: undefined } as unknown as DeviceManager,
      eventBus,
    );
    addTrackWith('unanswered', 'rejects');

    try {
      await expect(audioSinkManager.setVolume(0)).resolves.toBeUndefined();
      expect(audioSinkManager.getVolume()).toBe(0);
    } finally {
      audioSinkManager.cleanup();
    }
  });

  /**
   * A rejecting track settles the fan-out, so ordering and concurrency are invisible to the two
   * cases above. A hanging one is the incident shape - a lost reply - and shows both: the sink
   * must record the new volume before the fan-out returns, and tracks must be asked concurrently
   * rather than one after another.
   */
  it('records the volume and reaches later tracks while a track is still hanging', async () => {
    const eventBus = new EventBus();
    const audioSinkManager = new AudioSinkManager(
      store,
      { outputDevice: undefined } as unknown as DeviceManager,
      eventBus,
    );
    addTrackWith('hangs', 'hangs');
    const later = addTrackWith('later', 'resolves');

    try {
      audioSinkManager.setVolume(0).catch(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(audioSinkManager.getVolume()).toBe(0);
      expect(later.getVolume()).toBe(0);
    } finally {
      audioSinkManager.cleanup();
    }
  });
});
