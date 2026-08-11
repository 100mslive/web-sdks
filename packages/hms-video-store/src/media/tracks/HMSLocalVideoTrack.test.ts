import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { EventBus } from '../../events/EventBus';
import { getVideoTrack } from '../../utils/track';
import { HMSVideoTrackSettingsBuilder } from '../settings';
import { HMSLocalStream } from '../streams/HMSLocalStream';

jest.mock('../../utils/track', () => ({
  ...jest.requireActual('../../utils/track'),
  getVideoTrack: jest.fn(),
}));

const getVideoTrackMock = getVideoTrack as jest.Mock;

const streamId = 'stream-1';
const trackId = 'track-1';

/**
 * An interrupted camera can come back reporting live and unmuted while producing frozen frames -
 * which is what this fake reports, so recovery can only come from the interruption itself.
 */
const makeNativeTrack = (id: string) =>
  ({
    id,
    kind: 'video',
    label: 'Fake camera',
    enabled: true,
    muted: false,
    readyState: 'live',
    getSettings: jest.fn(() => ({ deviceId: 'cam-1' })),
    getConstraints: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    stop: jest.fn(),
  } as unknown as MediaStreamTrack);

const makeLocalVideoTrack = (eventBus: EventBus = new EventBus()) => {
  const nativeStream = {
    id: streamId,
    getTracks: () => [],
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
  } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const settings = new HMSVideoTrackSettingsBuilder().build();
  return new HMSLocalVideoTrack(stream, makeNativeTrack(trackId), 'regular', eventBus, settings);
};

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

// jsdom has no canvas capture, and turning the camera off replaces the track with a blank one
beforeAll(() => {
  (HTMLCanvasElement.prototype as any).captureStream = () => ({
    getVideoTracks: () => [makeNativeTrack('blank')],
  });
});

describe('HMSLocalVideoTrack interruptions', () => {
  beforeEach(() => {
    setVisibility('visible');
    getVideoTrackMock.mockReset();
    getVideoTrackMock.mockImplementation(async () => makeNativeTrack('track-2'));
  });

  it('reacquires the camera on native unmute when the track is not publishing', async () => {
    const track = makeLocalVideoTrack();
    (track.nativeTrack as any).readyState = 'ended';

    (track as any).handleTrackMute();
    await track.handleTrackUnmuteNatively();

    expect(getVideoTrackMock).toHaveBeenCalledTimes(1);
    expect(track.nativeTrack.id).toBe('track-2');
  });

  // the OS restarts capture on its own here, a getUserMedia would only freeze the tile for longer
  it('does not replace a live track on native unmute, only replays the sinks', async () => {
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localVideoEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));

    const track = makeLocalVideoTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmuteNatively();

    expect(getVideoTrackMock).not.toHaveBeenCalled();
    expect(enabledUpdates).toEqual([false, true]);
  });

  it('reacquires the camera on foreground after the background turned it off', async () => {
    const track = makeLocalVideoTrack();

    setVisibility('hidden');
    (track.nativeTrack as any).enabled = false;
    (track as any).enabledStateBeforeBackground = true;
    (track as any).interrupted = true;
    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(getVideoTrackMock).toHaveBeenCalledTimes(1);
  });

  // backgrounding turns the camera off itself and turns it back on, the app hears nothing about it
  it('does not prompt for the camera it turned off to background', async () => {
    const eventBus = new EventBus();
    const interruptions: unknown[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalVideoTrack(eventBus);
    setVisibility('hidden');
    await (track as any).handleVisibilityChange();

    expect(interruptions).toEqual([]);

    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(interruptions).toEqual([]);
    // and it is the same flow that reacquires the camera
    expect(getVideoTrackMock).toHaveBeenCalled();
  });

  it('publishes a camera interruption to the app and clears the published mute', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean; type: string }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    const enabledUpdates: boolean[] = [];
    eventBus.localVideoEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));
    const unpaused = jest.fn();
    eventBus.localVideoUnmutedNatively.subscribe(unpaused);

    const track = makeLocalVideoTrack(eventBus);
    (track.nativeTrack as any).readyState = 'ended';
    (track as any).handleTrackMute();
    await track.handleTrackUnmuteNatively();

    expect(interruptions).toEqual([
      { started: true, reason: 'track-muted-natively', type: 'video', trackId: track.trackId },
      { started: false, reason: 'track-unmuted-natively', type: 'video', trackId: track.trackId },
    ]);
    // mute tells biz the camera is off, recovery has to take that back
    expect(enabledUpdates).toEqual([false, true]);
    expect(unpaused).toHaveBeenCalledTimes(1);
  });

  it('recovers once when the native unmute and the foreground event both fire', async () => {
    const track = makeLocalVideoTrack();
    (track.nativeTrack as any).readyState = 'ended';

    (track as any).handleTrackMute();
    await Promise.all([track.handleTrackUnmuteNatively(), (track as any).handleVisibilityChange()]);

    expect(getVideoTrackMock).toHaveBeenCalledTimes(1);
  });

  it('does not end the interruption when the camera fails to come back', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    // eventemitter2 rethrows the reserved 'error' event when nothing is listening
    eventBus.error.subscribe(() => {});
    getVideoTrackMock.mockRejectedValue(new Error('device in use'));

    const track = makeLocalVideoTrack(eventBus);
    (track.nativeTrack as any).readyState = 'ended';
    (track as any).handleTrackMute();
    await track.handleTrackUnmuteNatively();

    expect(interruptions.map(i => i.started)).toEqual([true]);
  });

  it('leaves an already off camera alone on foreground', async () => {
    const eventBus = new EventBus();
    const interruptions: unknown[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalVideoTrack(eventBus);
    // enabled is derived from the native track
    (track.nativeTrack as any).enabled = false;
    await (track as any).handleVisibilityChange();

    expect(getVideoTrackMock).not.toHaveBeenCalled();
    expect(interruptions).toEqual([]);
  });
});

describe('HMSLocalVideoTrack', () => {
  describe('removeOrReplaceProcessedTrack', () => {
    it('stops the previous processedTrack before overwriting with a new one', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const oldProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;
      const newProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;

      (track as any).processedTrack = oldProcessed;
      await (track as any).removeOrReplaceProcessedTrack(newProcessed);

      expect(oldProcessed.stop).toHaveBeenCalledTimes(1);
      expect(newProcessed.stop).not.toHaveBeenCalled();
      expect((track as any).processedTrack).toBe(newProcessed);
    });

    it('stops the previous processedTrack when reset to undefined', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const oldProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;
      (track as any).processedTrack = oldProcessed;

      await (track as any).removeOrReplaceProcessedTrack(undefined);

      expect(oldProcessed.stop).toHaveBeenCalledTimes(1);
      expect((track as any).processedTrack).toBeUndefined();
    });

    it('is a no-op when processedTrack is the same instance', async () => {
      const track = makeLocalVideoTrack();
      const replaceSpy = jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const same = { stop: jest.fn() } as unknown as MediaStreamTrack;
      (track as any).processedTrack = same;

      await (track as any).removeOrReplaceProcessedTrack(same);

      expect(same.stop).not.toHaveBeenCalled();
      expect((track as any).processedTrack).toBe(same);
      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });
  });

  // The cheap single-plugin path is covered above. Real-world usage layers
  // multiple media-stream plugins (e.g. virtual background + brightness),
  // and processPlugins runs the whole chain on every add/remove. The chain's
  // *final* output is what becomes `processedTrack`; if that final output
  // isn't stopped before being overwritten on a re-run, the previous chain's
  // canvas-captureStream leaks until GC.
  describe('removeOrReplaceProcessedTrack with chained media-stream plugins', () => {
    type FakeMediaStreamCtor = new (tracks: MediaStreamTrack[]) => MediaStream;

    let originalMediaStream: FakeMediaStreamCtor | undefined;

    beforeAll(() => {
      // jsdom doesn't ship MediaStream; processPlugins calls
      // `new MediaStream([nativeTrack])` so we polyfill the minimum surface.
      originalMediaStream = (global as any).MediaStream;
      (global as any).MediaStream = class {
        tracks: MediaStreamTrack[];
        constructor(tracks: MediaStreamTrack[] = []) {
          this.tracks = tracks;
        }
        getVideoTracks() {
          return this.tracks.filter(t => t.kind === 'video');
        }
        getTracks() {
          return this.tracks;
        }
      };
    });

    afterAll(() => {
      (global as any).MediaStream = originalMediaStream;
    });

    const makeFakeTrack = (id: string): MediaStreamTrack => {
      return { id, kind: 'video', stop: jest.fn() } as any;
    };

    const makeFakePlugin = (name: string) => {
      let count = 0;
      const outputs: MediaStreamTrack[] = [];
      const plugin = {
        getName: () => name,
        apply: jest.fn((_stream: MediaStream) => {
          count += 1;
          const out = makeFakeTrack(`${name}-out-${count}`);
          outputs.push(out);
          return new (global as any).MediaStream([out]);
        }),
        stop: jest.fn(),
      };
      return { plugin, outputs };
    };

    it('two plugins → adding a third stops the prior chain output', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);
      jest.spyOn((track as any).videoHandler, 'updateSinks').mockImplementation(() => {});

      const a = makeFakePlugin('A');
      const b = makeFakePlugin('B');

      await track.addStreamPlugins([a.plugin, b.plugin] as any);

      // After the first chain run, processedTrack is the LAST plugin's output.
      const firstChainOutput = (track as any).processedTrack;
      expect(firstChainOutput).toBe(b.outputs[0]);
      expect(firstChainOutput.id).toBe('B-out-1');

      // Adding a third plugin re-runs the entire chain → A applies again, B
      // applies again on A's new output, C applies on B's new output. The
      // PRIOR processedTrack (B-out-1) must be stopped before being swapped
      // out for the new chain's final output.
      const c = makeFakePlugin('C');
      await track.addStreamPlugins([c.plugin] as any);

      expect(firstChainOutput.stop).toHaveBeenCalledTimes(1);
      expect((track as any).processedTrack).toBe(c.outputs[0]);
      expect((track as any).processedTrack.id).toBe('C-out-1');

      // Sanity: each plugin's apply ran twice (once per chain run).
      expect(a.plugin.apply).toHaveBeenCalledTimes(2);
      expect(b.plugin.apply).toHaveBeenCalledTimes(2);
      expect(c.plugin.apply).toHaveBeenCalledTimes(1);
    });

    it('two plugins → removing all stops the chain output and clears processedTrack', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);
      jest.spyOn((track as any).videoHandler, 'updateSinks').mockImplementation(() => {});

      const a = makeFakePlugin('A');
      const b = makeFakePlugin('B');

      await track.addStreamPlugins([a.plugin, b.plugin] as any);
      const chainOutput = (track as any).processedTrack;
      expect(chainOutput).toBe(b.outputs[0]);

      await track.removeStreamPlugins([a.plugin, b.plugin] as any);

      expect(chainOutput.stop).toHaveBeenCalledTimes(1);
      expect((track as any).processedTrack).toBeUndefined();
    });
  });

  // The earlier fix stopped the prior processedTrack BEFORE awaiting
  // sender.replaceTrack. That left the RTCRtpSender briefly wired to an
  // ended source — the encoder would stop producing while replaceTrack
  // landed, and the remote side would see a frame stutter on plugin swap.
  // The current ordering swaps the sender first, then stops the old track,
  // so the encoder never sees an ended source. These tests pin the order.
  describe('removeOrReplaceProcessedTrack ordering: swap sender before stopping old', () => {
    it('replaceSenderTrack resolves BEFORE old.stop() when overwriting', async () => {
      const track = makeLocalVideoTrack();

      const events: string[] = [];
      let resolveReplace!: () => void;
      jest.spyOn(track as any, 'replaceSenderTrack').mockImplementation(
        () =>
          new Promise<void>(resolve => {
            events.push('replaceSenderTrack:enter');
            resolveReplace = () => {
              events.push('replaceSenderTrack:resolve');
              resolve();
            };
          }),
      );

      const oldProcessed = {
        stop: jest.fn(() => events.push('oldProcessed.stop')),
      } as unknown as MediaStreamTrack;
      const newProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;

      (track as any).processedTrack = oldProcessed;
      const p = (track as any).removeOrReplaceProcessedTrack(newProcessed);

      // Run the function up to its first await on replaceSenderTrack.
      await Promise.resolve();

      // We're suspended inside removeOrReplaceProcessedTrack at the await.
      // The old track must NOT have been stopped yet — sender swap hasn't
      // landed.
      expect(events).toEqual(['replaceSenderTrack:enter']);
      expect(oldProcessed.stop).not.toHaveBeenCalled();

      // Resolve the sender swap; the function continues and stops the old.
      resolveReplace();
      await p;

      expect(events).toEqual(['replaceSenderTrack:enter', 'replaceSenderTrack:resolve', 'oldProcessed.stop']);
      expect(oldProcessed.stop).toHaveBeenCalledTimes(1);
      expect((track as any).processedTrack).toBe(newProcessed);
    });

    it('replaceSenderTrack resolves BEFORE old.stop() when clearing to undefined', async () => {
      const track = makeLocalVideoTrack();

      const events: string[] = [];
      let resolveReplace!: () => void;
      jest.spyOn(track as any, 'replaceSenderTrack').mockImplementation(
        () =>
          new Promise<void>(resolve => {
            events.push('replaceSenderTrack:enter');
            resolveReplace = () => {
              events.push('replaceSenderTrack:resolve');
              resolve();
            };
          }),
      );

      const oldProcessed = {
        stop: jest.fn(() => events.push('oldProcessed.stop')),
      } as unknown as MediaStreamTrack;

      (track as any).processedTrack = oldProcessed;
      const p = (track as any).removeOrReplaceProcessedTrack(undefined);

      await Promise.resolve();

      expect(events).toEqual(['replaceSenderTrack:enter']);
      expect(oldProcessed.stop).not.toHaveBeenCalled();

      resolveReplace();
      await p;

      expect(events).toEqual(['replaceSenderTrack:enter', 'replaceSenderTrack:resolve', 'oldProcessed.stop']);
      expect((track as any).processedTrack).toBeUndefined();
    });
  });
});
