import { AudioSinkManager } from './AudioSinkManager';
import { DeviceManager } from '../device-manager';
import { EventBus } from '../events/EventBus';
import { HMSRemoteAudioTrack } from '../media/tracks';
import { HMSRemotePeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';

/**
 * Reproduces the Aug 2026 silent-recording incident: the SFU never answered the
 * `prefer-audio-track-state` request for a peer that was already publishing when
 * the beam joined, so the audio element was never attached to the sink.
 */
type SubscribeOutcome = 'resolves' | 'never-settles' | 'rejects';

const buildTrack = (subscribe: SubscribeOutcome) => {
  const nativeTrack = { id: 'native-1', kind: 'audio', enabled: true } as MediaStreamTrack;
  let audioElement: HTMLAudioElement | null = null;
  return {
    trackId: 'track-1',
    nativeTrack,
    getAudioElement: () => audioElement,
    setAudioElement: (element: HTMLAudioElement | null) => {
      audioElement = element;
    },
    setVolume: () => {
      if (subscribe === 'never-settles') {
        return new Promise<void>(() => undefined);
      }
      return subscribe === 'rejects' ? Promise.reject(new Error('No response from SFU')) : Promise.resolve();
    },
    setOutputDevice: () => Promise.resolve(),
    getSinkId: () => undefined,
  } as unknown as HMSRemoteAudioTrack;
};

describe('AudioSinkManager', () => {
  let audioSinkManager: AudioSinkManager;
  let eventBus: EventBus;
  const peer = { peerId: 'peer-1' } as HMSRemotePeer;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.MediaStream = jest.fn().mockImplementation((tracks: MediaStreamTrack[]) => ({
      id: 'stream-1',
      tracks,
    })) as unknown as typeof MediaStream;
    eventBus = new EventBus();
    const store = { updateAudioOutputVolume: jest.fn() } as unknown as Store;
    const deviceManager = { outputDevice: undefined } as unknown as DeviceManager;
    audioSinkManager = new AudioSinkManager(store, deviceManager, eventBus);
    audioSinkManager.init();
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    audioSinkManager.cleanup();
    jest.restoreAllMocks();
  });

  const sinkChildren = () => document.querySelectorAll('[id^="HMS-SDK-audio-sink-"] audio');

  it('attaches the audio element when the subscribe round trip resolves', async () => {
    const track = buildTrack('resolves');

    await eventBus.audioTrackAdded.publish({ track, peer });

    expect(sinkChildren().length).toBe(1);
    expect(track.getAudioElement()?.srcObject).toBeTruthy();
  });

  it('attaches the audio element even when the subscribe round trip never resolves', async () => {
    const track = buildTrack('never-settles');

    await eventBus.audioTrackAdded.publish({ track, peer });

    expect(sinkChildren().length).toBe(1);
    expect(track.getAudioElement()?.srcObject).toBeTruthy();
  });

  it('does not reject when the subscribe round trip fails', async () => {
    const track = buildTrack('rejects');
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    await eventBus.audioTrackAdded.publish({ track, peer });
    await new Promise(resolve => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
    expect(sinkChildren().length).toBe(1);
  });
});
