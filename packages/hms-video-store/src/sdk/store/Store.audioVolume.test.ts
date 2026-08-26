import { Store } from './index';
import { AudioSinkManager } from '../../audio-sink-manager/AudioSinkManager';
import { DeviceManager } from '../../device-manager';
import { EventBus } from '../../events/EventBus';
import { makeRemoteAudioTrack } from '../../test/helpers/makeRemoteAudioTrack';

/**
 * A global volume change fans out one subscribe request per remote audio track. Running them in
 * series and letting the first rejection out of the loop means one unanswered request leaves every
 * track after it in the list untouched - and, because the sink manager records the new volume only
 * once the whole loop returns, every track added later gets the old volume too.
 */
describe('Store.updateAudioOutputVolume', () => {
  let store: Store;

  const addTrack = (id: string, answers: boolean) => {
    const { track } = makeRemoteAudioTrack({ id, subscribe: answers ? 'resolves' : 'rejects' });
    track.setAudioElement(document.createElement('audio'));
    store.addTrack(track);
    return track;
  };

  beforeEach(() => {
    store = new Store();
  });

  it('applies the volume to the tracks after one whose request fails', async () => {
    addTrack('first', true);
    addTrack('unanswered', false);
    const last = addTrack('last', true);

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
    addTrack('unanswered', false);

    try {
      await expect(audioSinkManager.setVolume(0)).resolves.toBeUndefined();
      expect(audioSinkManager.getVolume()).toBe(0);
    } finally {
      audioSinkManager.cleanup();
    }
  });
});
