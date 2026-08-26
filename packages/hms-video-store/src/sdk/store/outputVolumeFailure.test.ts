import { Store } from './Store';
import { HMSRemoteAudioTrack } from '../../media/tracks';
import HMSLogger from '../../utils/logger';

/**
 * The global volume slider walks every audio track. A remote track's setVolume applies the
 * subscription over the API data channel, so one unanswered request used to abort the walk -
 * every track after it kept the old volume, and AudioSinkManager never recorded the new one.
 */
describe('Store.updateAudioOutputVolume when one track cannot be updated', () => {
  let store: Store;
  let failing: HMSRemoteAudioTrack;
  let healthy: HMSRemoteAudioTrack;
  let logError: jest.SpyInstance;

  const makeTrack = (id: string, setVolume: jest.Mock) =>
    ({ trackId: id, type: 'audio', setVolume, toString: () => id } as unknown as HMSRemoteAudioTrack);

  beforeEach(() => {
    logError = jest.spyOn(HMSLogger, 'e').mockImplementation(() => undefined);
    failing = makeTrack(
      'track-failing',
      jest.fn().mockRejectedValue(new Error('No response from SFU for prefer-audio-track-state')),
    );
    healthy = makeTrack('track-healthy', jest.fn().mockResolvedValue(undefined));

    store = new Store();
    jest.spyOn(store, 'getAudioTracks').mockReturnValue([failing, healthy]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('still applies the volume to the tracks after it, and does not reject', async () => {
    await expect(store.updateAudioOutputVolume(30)).resolves.toBeUndefined();

    expect(failing.setVolume).toHaveBeenCalledWith(30);
    expect(healthy.setVolume).toHaveBeenCalledWith(30);
    expect(logError).toHaveBeenCalled();
  });
});
