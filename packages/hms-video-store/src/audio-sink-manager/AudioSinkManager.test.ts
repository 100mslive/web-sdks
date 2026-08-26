import { AudioSinkManager } from './AudioSinkManager';
import { DeviceManager } from '../device-manager';
import { AudioOutputManager } from '../device-manager/AudioOutputManager';
import { EventBus } from '../events/EventBus';
import { HMSRemoteAudioTrack } from '../media/tracks';
import { HMSRemotePeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';
import { makeRemoteAudioTrack } from '../test/helpers/makeRemoteAudioTrack';

/**
 * Reproduces the Aug 2026 silent-recording incident: the SFU never answered the
 * `prefer-audio-track-state` request for a peer that was already publishing when
 * the beam joined, so the audio element was never attached to the sink.
 */
type StubOutcome = 'resolves' | 'never-settles' | 'rejects';

const buildTrack = (subscribe: StubOutcome) => {
  const nativeTrack = { id: 'native-1', kind: 'audio', enabled: true } as MediaStreamTrack;
  let audioElement: HTMLAudioElement | null = null;
  return {
    trackId: 'track-1',
    nativeTrack,
    getAudioElement: () => audioElement,
    getRequestedVolume: () => undefined,
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

  let realMediaStream: typeof MediaStream;

  beforeEach(() => {
    document.body.innerHTML = '';
    realMediaStream = window.MediaStream;
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
    // a direct assignment, so restoreAllMocks cannot put the real one back
    window.MediaStream = realMediaStream;
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

  /**
   * Volume is applied to the element where the element is created, so it is carried before play()
   * whatever happens to the subscribe round trip - which the fake track above stubs out entirely.
   * These use a real HMSRemoteAudioTrack so setVolume's own ordering is exercised.
   */
  describe('volume on the element it creates', () => {
    /**
     * The window that matters is the one around play(), not the state once everything settles -
     * a track turned down after play() has started it is audible for exactly as long as play()
     * takes, on every track add and on every decode-error element rebuild.
     */
    it('is never audible at full volume, including at the moment play() is called', async () => {
      const volumeAtPlay: number[] = [];
      jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
        volumeAtPlay.push(this.volume);
        return Promise.resolve();
      });
      await audioSinkManager.setVolume(0);
      const track = makeRemoteAudioTrack({ subscribe: 'hangs' }).track;

      await eventBus.audioTrackAdded.publish({ track, peer });
      await new Promise(resolve => setTimeout(resolve, 0));

      // every observation is exactly 0, and there was at least one - not merely "never 1",
      // which would pass for any wrong-but-not-full value
      expect(volumeAtPlay.length).toBeGreaterThan(0);
      expect([...new Set(volumeAtPlay)]).toEqual([0]);
    });

    /**
     * Through AudioOutputManager, the path HMSSDKActions awaits. It must reject rather than throw synchronously or drop the promise - either way the
     * rejection escapes as unhandled and the app is told the volume was applied.
     */
    it.each([150, -1, NaN])('rejects %p through the public path rather than recording it', async value => {
      const audioOutput = new AudioOutputManager(
        { outputDevice: undefined } as unknown as DeviceManager,
        audioSinkManager,
      );

      await expect(audioOutput.setVolume(value)).rejects.toThrow('Please pass a valid number between 0-100');
      expect(audioSinkManager.getVolume()).toBe(100);
    });

    it('still adds a working audio element after a rejected volume', async () => {
      await audioSinkManager.setVolume(150).catch(() => undefined);
      const track = makeRemoteAudioTrack().track;

      await eventBus.audioTrackAdded.publish({ track, peer });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(track.getAudioElement()).toBeTruthy();
      expect(track.getAudioElement()?.srcObject).toBeTruthy();
    });

    /**
     * handleTrackAdd runs again on MEDIA_ERR_DECODE recovery (and on renegotiation), so the volume
     * it puts on the rebuilt element must be the one that applies to *this* track. Using the global
     * sink volume there hands a peer the user muted individually back at full volume, and
     * resubscribes them at the SFU, while the UI still shows them muted.
     */
    it('keeps a per-track mute across an element rebuild', async () => {
      const track = makeRemoteAudioTrack().track;
      await eventBus.audioTrackAdded.publish({ track, peer });
      await new Promise(resolve => setTimeout(resolve, 0));
      // the user mutes this one peer from the tile menu
      await track.setVolume(0);

      // chrome raises a decode error; the sink manager rebuilds the element
      await eventBus.audioTrackAdded.publish({ track, peer });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(track.getAudioElement()?.volume).toBe(0);
    });

    it('carries the volume even when the subscribe call rejects outright', async () => {
      await audioSinkManager.setVolume(0);
      const track = makeRemoteAudioTrack({ subscribe: 'hangs' }).track;
      jest.spyOn(track, 'setVolume').mockRejectedValue(new Error('No response from SFU'));

      await eventBus.audioTrackAdded.publish({ track, peer });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(track.getAudioElement()?.volume).toBe(0);
      expect(track.getAudioElement()?.srcObject).toBeTruthy();
    });
  });
});
