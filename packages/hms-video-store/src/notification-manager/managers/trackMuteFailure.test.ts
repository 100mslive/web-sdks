import { TrackManager } from './TrackManager';
import { EventBus } from '../../events/EventBus';
import { HMSUpdateListener } from '../../interfaces';
import { HMSRemoteAudioTrack } from '../../media/tracks';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { TrackStateNotification } from '../HMSNotifications';

/**
 * A remote peer muting or unmuting runs setEnabled on their track, which applies the subscription
 * over the API data channel. The notification handler discards that promise, so an unanswered
 * request used to surface as an unhandled rejection - and in node that takes the process down.
 */
describe('TrackManager when the mute state cannot be applied', () => {
  let manager: TrackManager;
  let store: Store;
  let track: HMSRemoteAudioTrack;
  let logError: jest.SpyInstance;

  const trackId = 'track-1';
  const peerId = 'peer-1';

  beforeEach(() => {
    logError = jest.spyOn(HMSLogger, 'e').mockImplementation(() => undefined);
    track = {
      trackId,
      peerId,
      type: 'audio',
      source: 'regular',
      enabled: true,
      setEnabled: jest.fn().mockRejectedValue(new Error('No response from SFU for prefer-audio-track-state')),
      toString: () => 'remote-audio-track-1',
    } as unknown as HMSRemoteAudioTrack;

    store = {
      getTrackById: jest.fn().mockReturnValue(track),
      getPeerByTrackId: jest.fn().mockReturnValue({ peerId, name: 'remote' }),
      getPeerById: jest.fn().mockReturnValue({ peerId, name: 'remote' }),
      getTrackState: jest.fn().mockReturnValue({ peerId, trackInfo: { mute: true, source: 'regular' } }),
      setTrackState: jest.fn(),
    } as unknown as Store;

    manager = new TrackManager(store, {} as EventBus, {} as unknown as HMSUpdateListener);
    (manager as unknown as { tracksToProcess: Map<string, unknown> }).tracksToProcess = new Map();
  });

  afterEach(() => jest.restoreAllMocks());

  /**
   * handleTrackUpdate returns void, so there is no promise to await for this the way the observer
   * handlers are tested. Watching for an unhandledrejection event would prove nothing either -
   * jsdom never dispatches one, and jest owns the process-level handler. What actually keeps the
   * rejection from leaking is that something attached a handler to it, so assert exactly that.
   */
  it('attaches a rejection handler and logs, rather than leaking', async () => {
    const rejection = Promise.reject(new Error('No response from SFU for prefer-audio-track-state'));
    const attachHandler = jest.spyOn(rejection, 'catch');
    (track.setEnabled as jest.Mock).mockReturnValue(rejection);

    const notification = {
      tracks: { [trackId]: { track_id: trackId, mute: true, source: 'regular', type: 'audio' } },
      peer: { peer_id: peerId },
    } as unknown as TrackStateNotification;
    manager.handleTrackUpdate(notification);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(track.setEnabled).toHaveBeenCalledWith(false);
    expect(attachHandler).toHaveBeenCalled();
    expect(logError).toHaveBeenCalled();
  });
});
