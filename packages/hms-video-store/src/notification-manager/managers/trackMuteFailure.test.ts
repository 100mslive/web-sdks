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

  it('logs the failure instead of leaking an unhandled rejection', async () => {
    const rejections: unknown[] = [];
    const onUnhandled = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      rejections.push(e.reason);
    };
    window.addEventListener('unhandledrejection', onUnhandled);

    const notification = {
      tracks: { [trackId]: { track_id: trackId, mute: true, source: 'regular', type: 'audio' } },
      peer: { peer_id: peerId },
    } as unknown as TrackStateNotification;
    manager.handleTrackUpdate(notification);

    await new Promise(resolve => setTimeout(resolve, 0));
    window.removeEventListener('unhandledrejection', onUnhandled);

    expect(track.setEnabled).toHaveBeenCalledWith(false);
    expect(logError).toHaveBeenCalled();
    expect(rejections).toHaveLength(0);
  });
});
