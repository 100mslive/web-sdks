import { HMSAudioPlugin, HMSAudioPluginType } from './HMSAudioPlugin';
import { HMSAudioPluginsManager } from './HMSAudioPluginsManager';
import { EventBus } from '../../events/EventBus';

const node = () => ({ connect: jest.fn(), disconnect: jest.fn(), context: 'ctx' });
const audioContext = {
  sampleRate: 48000,
  createMediaStreamSource: jest.fn(() => node()),
  createMediaStreamDestination: jest.fn(() => ({
    ...node(),
    stream: { getAudioTracks: () => [{ id: 'processed', stop: jest.fn() }] },
  })),
};

// jsdom has neither, the manager creates both
beforeAll(() => {
  (global as any).AudioContext = jest.fn(() => audioContext);
  (global as any).MediaStream = jest.fn();
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const makeTrack = () => ({ nativeTrack: { id: 'mic' }, setProcessedTrack: jest.fn(async () => {}) } as any);

/** a plugin whose processAudioTrack stays pending until the test releases it, like Krisp's filter creation */
const makePlugin = () => {
  let release!: (n: unknown) => void;
  const pending = new Promise(resolve => (release = resolve));
  const plugin = {
    getName: () => 'FakePlugin',
    getPluginType: () => HMSAudioPluginType.TRANSFORM,
    checkSupport: () => ({ isSupported: true }),
    isSupported: () => true,
    init: jest.fn(async () => {}),
    processAudioTrack: jest.fn(() => pending),
    stop: jest.fn(),
  } as unknown as HMSAudioPlugin & { init: jest.Mock; processAudioTrack: jest.Mock; stop: jest.Mock };
  return { plugin, release };
};

describe('HMSAudioPluginsManager reprocess vs in-flight add', () => {
  it('does not tear the plugin down under an add that is still in progress', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin();

    // app adds the plugin; init is done, the filter node is still being created
    const add = manager.addPlugin(plugin);
    await flush();
    expect(plugin.processAudioTrack).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual(['FakePlugin']);

    // the mic track gets replaced meanwhile, which reprocesses every plugin
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
    expect(manager.getPlugins()).toEqual(['FakePlugin']);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
  });
});
