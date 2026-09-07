import { HMSAudioPlugin, HMSAudioPluginType } from './HMSAudioPlugin';
import { HMSAudioPluginsManager } from './HMSAudioPluginsManager';
import { EventBus } from '../../events/EventBus';

const node = () => ({ connect: jest.fn(), disconnect: jest.fn(), context: 'ctx' });
const audioContext = {
  sampleRate: 48000,
  // keep the stream on the node so a test can see which mic track a source was built from
  createMediaStreamSource: jest.fn((stream: unknown) => ({ ...node(), stream })),
  createMediaStreamDestination: jest.fn(() => ({
    ...node(),
    stream: { getAudioTracks: () => [{ id: 'processed', stop: jest.fn() }] },
  })),
};

// jsdom has neither, the manager creates both
beforeAll(() => {
  (global as any).AudioContext = jest.fn(() => audioContext);
  (global as any).MediaStream = jest.fn((tracks: unknown[]) => ({ tracks }));
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const makeTrack = () => ({ nativeTrack: { id: 'mic' }, setProcessedTrack: jest.fn(async () => {}) } as any);

/** a plugin whose first init or processAudioTrack can stay pending until the test releases it, like Krisp's SDK and filter creation */
const makePlugin = ({
  name = 'FakePlugin',
  pendingStep,
}: { name?: string; pendingStep?: 'init' | 'processAudioTrack' } = {}) => {
  let release!: (n?: unknown) => void;
  const pending = new Promise(resolve => (release = resolve));
  const plugin = {
    getName: () => name,
    getPluginType: () => HMSAudioPluginType.TRANSFORM,
    checkSupport: () => ({ isSupported: true }),
    isSupported: () => true,
    init: jest.fn(async () => {}),
    processAudioTrack: jest.fn(async () => node()),
    stop: jest.fn(),
  } as unknown as HMSAudioPlugin & { init: jest.Mock; processAudioTrack: jest.Mock; stop: jest.Mock };
  // only the first call hangs, the re-add during a reprocess completes on its own
  if (pendingStep) {
    plugin[pendingStep].mockImplementationOnce(() => pending);
  }
  return { plugin, release };
};

describe('HMSAudioPluginsManager with an add in flight', () => {
  it('does not tear the plugin down under an add that is still in progress', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'processAudioTrack' });

    // app adds the plugin; init is done, the filter node is still being created
    const add = manager.addPlugin(plugin);
    await flush();
    expect(plugin.processAudioTrack).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual(['FakePlugin']);

    // the mic track gets replaced meanwhile, which reprocesses every plugin
    track.nativeTrack = { id: 'mic-2' };
    const reprocess = manager.reprocessPlugins();
    await flush();
    // the reprocess must wait for the add instead of stopping the plugin under it
    expect(plugin.stop).not.toHaveBeenCalled();

    release(node());
    await add;
    await reprocess;
    // then rebuilt it once against the new track, and it ended up registered and published
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(plugin.init).toHaveBeenCalledTimes(2);
    expect(plugin.processAudioTrack).toHaveBeenCalledTimes(2);
    expect(plugin.processAudioTrack).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ stream: { tracks: [{ id: 'mic-2' }] } }),
    );
    expect(manager.getPlugins()).toEqual(['FakePlugin']);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
  });

  it('waits for an in-flight add before tearing everything down on leave', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'init' });

    const add = manager.addPlugin(plugin);
    await flush();
    expect(plugin.init).toHaveBeenCalledTimes(1);

    // the peer leaves while the plugin is still initialising
    const cleanup = manager.cleanup();
    await flush();
    release();
    await add;
    await cleanup;
    // the plugin must not outlive the leave: stopped, unregistered, nothing published
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('drops Krisp on reprocess once the room no longer allows noise cancellation', async () => {
    const track = makeTrack();
    const room = { isNoiseCancellationEnabled: true } as any;
    const manager = new HMSAudioPluginsManager(track, new EventBus(), room);
    const { plugin } = makePlugin({ name: 'HMSKrispPlugin' });

    await manager.addPlugin(plugin);
    expect(manager.getPlugins()).toEqual(['HMSKrispPlugin']);

    // the template policy turns noise cancellation off, then the mic is switched
    room.isNoiseCancellationEnabled = false;
    await expect(manager.reprocessPlugins()).rejects.toThrow('not enabled for this room');
    // same outcome as an app add being refused: Krisp is stopped, not restarted, nothing published
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(plugin.init).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });
});
