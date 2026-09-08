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
  it.each(['init', 'processAudioTrack'] as const)('releases restarted resources when %s fails', async failedStep => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin } = makePlugin();
    let resourcesLive = false;
    plugin.init.mockImplementation(async () => {
      resourcesLive = true;
    });
    plugin.stop.mockImplementation(() => {
      resourcesLive = false;
    });
    await manager.addPlugin(plugin);

    plugin[failedStep].mockImplementationOnce(async () => {
      resourcesLive = true;
      throw new Error('restart failed');
    });
    await expect(manager.reprocessPlugins()).rejects.toThrow(/failed/);

    expect(resourcesLive).toBe(false);
    expect(plugin.stop).toHaveBeenCalledTimes(2);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);

    // The failed startup must also leave the queue and plugin usable for another attempt.
    await manager.addPlugin(plugin);
    expect(manager.getPlugins()).toEqual(['FakePlugin']);
    await manager.cleanup();
    expect(resourcesLive).toBe(false);
  });

  it.each(['init', 'processAudioTrack'] as const)(
    'publishes native audio while a device switch waits for plugin %s',
    async pendingStep => {
      const track = makeTrack();
      const manager = new HMSAudioPluginsManager(track, new EventBus());
      const { plugin } = makePlugin();
      await manager.addPlugin(plugin);
      const oldOutput = track.setProcessedTrack.mock.calls[0][0];
      track.setProcessedTrack.mockClear();

      let release!: () => void;
      plugin[pendingStep].mockImplementationOnce(() => new Promise(resolve => (release = () => resolve(node()))));
      track.nativeTrack = { id: 'mic-2' };
      const reprocess = manager.reprocessPlugins();
      await flush();

      expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
      expect(track.setProcessedTrack.mock.invocationCallOrder[0]).toBeLessThan(plugin.stop.mock.invocationCallOrder[0]);
      expect(oldOutput.stop).toHaveBeenCalledTimes(1);

      release();
      await reprocess;
      expect(plugin.processAudioTrack).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ stream: { tracks: [{ id: 'mic-2' }] } }),
      );
      expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
    },
  );

  it('does not restart plugins if cleanup runs while switching back to native audio', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin } = makePlugin();
    await manager.addPlugin(plugin);

    let release!: () => void;
    track.setProcessedTrack.mockImplementationOnce(() => new Promise<void>(resolve => (release = resolve)));
    const reprocess = manager.reprocessPlugins();
    await flush();
    await manager.cleanup();
    await manager.closeContext();

    release();
    await reprocess;
    expect(plugin.init).toHaveBeenCalledTimes(1);
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('does not tear the plugin down under an add that is still in progress', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'processAudioTrack' });

    // app adds the plugin; init is done, the filter node is still being created
    const add = manager.addPlugin(plugin);
    await flush();
    expect(plugin.processAudioTrack).toHaveBeenCalledTimes(1);
    // a plugin is only registered once it is wired up, so nothing is published or listed yet
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).not.toHaveBeenCalled();

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

  it('tears down on leave without waiting for an in-flight add, and the add unwinds itself', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'init' });

    let added = false;
    const add = manager.addPlugin(plugin).then(() => (added = true));
    await flush();
    expect(plugin.init).toHaveBeenCalledTimes(1);

    // the peer leaves while the plugin is still initialising. track teardown awaits this before it
    // stops the tracks and drops its listeners, so it must not be gated on plugin code
    await manager.cleanup();
    expect(added).toBe(false);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);

    // the add resumes on a torn down manager and must not resurrect the plugin
    release();
    await add;
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(plugin.processAudioTrack).not.toHaveBeenCalled();
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('does not remove a plugin from under an add that is still in progress', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'processAudioTrack' });

    const add = manager.addPlugin(plugin);
    await flush();
    expect(plugin.processAudioTrack).toHaveBeenCalledTimes(1);

    // app toggles the plugin off while the filter node is still being created
    const remove = manager.removePlugin(plugin);
    await flush();
    // the mid point is the assertion: an end state check passes even when the remove runs early
    expect(plugin.stop).not.toHaveBeenCalled();

    release(node());
    await add;
    await remove;
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('queues adds that land behind a reprocess instead of failing them as already in progress', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin: first } = makePlugin({ name: 'First' });
    const { plugin: second } = makePlugin({ name: 'Second' });
    const { plugin: third } = makePlugin({ name: 'Third' });

    await manager.addPlugin(first);

    // the mic is switched and the re-add hangs on the filter node
    let release!: () => void;
    first.processAudioTrack.mockImplementationOnce(() => new Promise(resolve => (release = () => resolve(node()))));
    const reprocess = manager.reprocessPlugins();
    await flush();

    // the app enables two more plugins while that reprocess is still running. neither is in progress,
    // they are queued, so neither may be refused with AddAlreadyInProgress
    const adds = Promise.all([manager.addPlugin(second), manager.addPlugin(third)]);
    await flush();

    release();
    await reprocess;
    await adds;
    expect(manager.getPlugins()).toEqual(['First', 'Second', 'Third']);
  });

  it.each([
    ['HMSKrispPlugin', 'Other'],
    ['Other', 'HMSKrispPlugin'],
  ])('drops only Krisp on reprocess when the room turns it off, added as [%s, %s]', async (...order) => {
    const track = makeTrack();
    const room = { isNoiseCancellationEnabled: true } as any;
    const manager = new HMSAudioPluginsManager(track, new EventBus(), room);
    const plugins = order.map(name => makePlugin({ name }).plugin);

    for (const plugin of plugins) {
      await manager.addPlugin(plugin);
    }
    const other = plugins[order.indexOf('Other')];

    room.isNoiseCancellationEnabled = false;
    // rejects in either order: the reprocess must never report success while dropping Krisp
    await expect(manager.reprocessPlugins()).rejects.toThrow('not enabled for this room');

    // and the plugin that is still allowed keeps its graph rather than being collateral
    // note: a rebuild restarts every plugin it keeps, so stop/init counts differ by insertion order
    expect(manager.getPlugins()).toEqual(['Other']);
    expect(other.processAudioTrack).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ stream: { tracks: [{ id: 'mic' }] } }),
    );
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
  });

  it('goes back to the native track when a plugin cannot attach, instead of publishing a dead node', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin } = makePlugin();
    plugin.processAudioTrack.mockRejectedValueOnce(new Error('filter node failed'));

    // on main this resolved as a success and published an unfed destination node: the peer sent silence
    await expect(manager.addPlugin(plugin)).rejects.toThrow('filter node failed');
    expect(manager.getPlugins()).toEqual([]);
    expect(plugin.stop).toHaveBeenCalledTimes(1);
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
