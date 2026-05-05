import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { EventBus } from '../../events/EventBus';
import { HMSVideoTrackSettingsBuilder } from '../settings';
import { HMSLocalStream } from '../streams/HMSLocalStream';

const streamId = 'stream-1';
const trackId = 'track-1';

const makeLocalVideoTrack = () => {
  const nativeStream = { id: streamId, getTracks: () => [] } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const nativeTrack = {
    id: trackId,
    kind: 'video',
    enabled: true,
    getSettings: jest.fn(() => ({})),
    addEventListener: jest.fn(),
  } as unknown as MediaStreamTrack;
  const settings = new HMSVideoTrackSettingsBuilder().build();
  return new HMSLocalVideoTrack(stream, nativeTrack, 'regular', new EventBus(), settings);
};

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
