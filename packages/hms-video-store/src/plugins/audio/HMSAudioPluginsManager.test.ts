import { HMSAudioPlugin, HMSAudioPluginType } from './HMSAudioPlugin';
import { HMSAudioPluginsManager } from './HMSAudioPluginsManager';
import { PluginUsageTracker } from '../../common/PluginUsageTracker';
import { HMSException } from '../../error/HMSException';
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

/** a rebuild restarts every plugin, so the failures of the ones the caller never asked about arrive here */
const collectFailures = (eventBus: EventBus) => {
  const failures: HMSException[] = [];
  eventBus.audioPluginFailed.subscribe(failure => failures.push(failure));
  return failures;
};

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
  // the audioContext mock is shared by every case, keep its call history per test
  beforeEach(() => jest.clearAllMocks());

  it('ends usage when initial processing fails before the plugin is registered', async () => {
    let now = 1000;
    const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
    try {
      const eventBus = new EventBus();
      const usage = new PluginUsageTracker(eventBus);
      const manager = new HMSAudioPluginsManager(makeTrack(), eventBus, { isNoiseCancellationEnabled: true } as any);
      const { plugin } = makePlugin({ name: 'HMSKrispPlugin' });
      plugin.processAudioTrack.mockImplementationOnce(async () => {
        now = 2000;
        throw new Error('filter creation failed');
      });

      await expect(manager.addPlugin(plugin)).rejects.toMatchObject({
        code: 7003,
        description: 'filter creation failed',
      });
      now = 62000;
      expect(usage.getPluginUsage('HMSKrispPlugin')).toBe(1000);
      await manager.cleanup();
    } finally {
      clock.mockRestore();
    }
  });

  it.each(['init', 'processAudioTrack'] as const)(
    'ends usage immediately when cleanup interrupts %s',
    async pendingStep => {
      let now = 1000;
      const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
      try {
        const eventBus = new EventBus();
        const usage = new PluginUsageTracker(eventBus);
        const manager = new HMSAudioPluginsManager(makeTrack(), eventBus, { isNoiseCancellationEnabled: true } as any);
        const { plugin, release } = makePlugin({ name: 'HMSKrispPlugin', pendingStep });
        const add = manager.addPlugin(plugin);
        await flush();
        now = 2000;
        await manager.cleanup();

        // Startup may never settle; accounting must already be closed at teardown.
        now = 62000;
        expect(usage.getPluginUsage('HMSKrispPlugin')).toBe(1000);
        release(node());
        await add;
        now = 122000;
        expect(usage.getPluginUsage('HMSKrispPlugin')).toBe(1000);
      } finally {
        clock.mockRestore();
      }
    },
  );

  it('preserves Krisp usage across repeated device switches and cleanup', async () => {
    let now = 1000;
    const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
    try {
      const eventBus = new EventBus();
      const usage = new PluginUsageTracker(eventBus);
      const track = makeTrack();
      const manager = new HMSAudioPluginsManager(track, eventBus, { isNoiseCancellationEnabled: true } as any);
      await manager.addPlugin(makePlugin({ name: 'HMSKrispPlugin' }).plugin);

      now += 10 * 60 * 1000;
      track.nativeTrack = { id: 'mic-2' };
      await manager.reprocessPlugins();
      now += 60 * 1000;
      track.nativeTrack = { id: 'mic-3' };
      await manager.reprocessPlugins();
      now += 2 * 60 * 1000;
      await manager.cleanup();

      now += 60 * 1000;
      expect(usage.getPluginUsage('HMSKrispPlugin')).toBe(13 * 60 * 1000);
    } finally {
      clock.mockRestore();
    }
  });

  it('publishes krisp.start on an app enable only, not on every device switch', async () => {
    const eventBus = new EventBus();
    const events: string[] = [];
    eventBus.analytics.subscribe(event => events.push(event.name));
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, eventBus, { isNoiseCancellationEnabled: true } as any);

    await manager.addPlugin(makePlugin({ name: 'HMSKrispPlugin' }).plugin);
    for (const id of ['mic-2', 'mic-3']) {
      track.nativeTrack = { id };
      await manager.reprocessPlugins();
    }

    // main published one per rebuild too, so two mic switches reported three enables
    expect(events.filter(name => name === 'krisp.start')).toHaveLength(1);
  });

  it('publishes no krisp.start for an add of a running plugin and no krisp.stop for an absent one', async () => {
    const eventBus = new EventBus();
    const events: string[] = [];
    eventBus.analytics.subscribe(event => events.push(event.name));
    const manager = new HMSAudioPluginsManager(makeTrack(), eventBus, { isNoiseCancellationEnabled: true } as any);
    const { plugin } = makePlugin({ name: 'HMSKrispPlugin' });

    await manager.removePlugin(plugin);
    await manager.addPlugin(plugin);
    await manager.addPlugin(plugin);

    // both events are published from inside the queued task, after it knows there is work to do
    expect(events.filter(name => name.startsWith('krisp'))).toEqual(['krisp.start']);
  });

  it.each([
    ['init', 7002],
    ['processAudioTrack', 7003],
  ] as const)('releases restarted resources when %s fails', async (failedStep, code) => {
    const track = makeTrack();
    const eventBus = new EventBus();
    const failures = collectFailures(eventBus);
    const manager = new HMSAudioPluginsManager(track, eventBus);
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
    // a reprocess asked about no plugin in particular, so its failures go out as events
    await manager.reprocessPlugins();
    expect(failures.map(failure => failure.code)).toEqual([code]);

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
      // a rebuild must not unregister what it is restarting: clone() gates plugin migration on this
      expect(manager.getPlugins()).toEqual(['FakePlugin']);

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
    // the reprocess must wait for the add instead of stopping the plugin under it. Unqueued it runs
    // now, on an empty map, and rebuilds nothing - the end state below is what catches that
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
    // unqueued the remove runs now, finds an empty map and is silently dropped: the plugin stays
    // live and published after the user toggled it off, which the end state below catches
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
    const eventBus = new EventBus();
    const failures = collectFailures(eventBus);
    const manager = new HMSAudioPluginsManager(track, eventBus, room);
    const plugins = order.map(name => makePlugin({ name }).plugin);

    for (const plugin of plugins) {
      await manager.addPlugin(plugin);
    }
    const other = plugins[order.indexOf('Other')];

    room.isNoiseCancellationEnabled = false;
    // reported in either order: the reprocess must never drop Krisp silently
    await manager.reprocessPlugins();
    expect(failures).toEqual([
      expect.objectContaining({ code: 7006, description: expect.stringContaining('not enabled for this room') }),
    ]);

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
    await expect(manager.addPlugin(plugin)).rejects.toMatchObject({ code: 7003, description: 'filter node failed' });
    expect(manager.getPlugins()).toEqual([]);
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('rejects an add with its own failure, not with the failure of a plugin it restarted', async () => {
    const track = makeTrack();
    const eventBus = new EventBus();
    const failures = collectFailures(eventBus);
    const manager = new HMSAudioPluginsManager(track, eventBus);
    const { plugin: first } = makePlugin({ name: 'First' });
    const { plugin: second } = makePlugin({ name: 'Second' });

    await manager.addPlugin(first);
    // the rebuild this add triggers also restarts the first plugin, and that restart fails
    first.processAudioTrack.mockRejectedValueOnce(new Error('restart failed'));
    await manager.addPlugin(second);

    // the app asked for Second and got it, so First's failure must not surface as this add's error
    expect(manager.getPlugins()).toEqual(['Second']);
    expect(failures).toEqual([expect.objectContaining({ description: 'restart failed' })]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
  });

  it('drops a plugin whose support check throws without costing a running plugin its graph', async () => {
    const track = makeTrack();
    const eventBus = new EventBus();
    const failures = collectFailures(eventBus);
    const manager = new HMSAudioPluginsManager(track, eventBus);
    const { plugin: running } = makePlugin({ name: 'Running' });
    const { plugin: broken } = makePlugin({ name: 'Broken' });
    (broken as any).checkSupport = () => {
      throw new Error('support check blew up');
    };

    await manager.addPlugin(running);
    await expect(manager.addPlugin(broken)).rejects.toMatchObject({
      code: 7003,
      description: 'support check blew up',
    });

    // this rebuild had already dismantled the running plugin's graph, so it has to publish the one
    // it rebuilt: an untyped failure must not escape past that on its way to analytics
    expect(manager.getPlugins()).toEqual(['Running']);
    expect(failures).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'processed' }));
  });

  it('drops a plugin that hands back no audio node instead of publishing an unfed graph', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin } = makePlugin();
    plugin.processAudioTrack.mockResolvedValueOnce(undefined);

    // nothing feeds the destination node in this case, and no client side check can see that:
    // the audio level monitor reads the native track, so the local meter looks healthy
    await expect(manager.addPlugin(plugin)).rejects.toMatchObject({ code: 7003 });
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });

  it('leaves the sender alone on a device change in a session without plugins', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());

    track.nativeTrack = { id: 'mic-2' };
    await manager.reprocessPlugins();

    // most sessions never add an audio plugin, and updateTrack has already replaced the sender track
    expect(track.setProcessedTrack).not.toHaveBeenCalled();
  });

  it('publishes nothing more once cleanup has run, with rebuilds still on the queue', async () => {
    const track = makeTrack();
    const manager = new HMSAudioPluginsManager(track, new EventBus());
    const { plugin, release } = makePlugin({ pendingStep: 'init' });

    const add = manager.addPlugin(plugin);
    await flush();
    const queued = [manager.reprocessPlugins(), manager.reprocessPlugins()];
    await manager.cleanup();
    const published = track.setProcessedTrack.mock.calls.length;

    release();
    await Promise.all([add, ...queued]);
    // whatever was already queued must unwind, not publish onto the graph cleanup tore down
    expect(track.setProcessedTrack.mock.calls.length).toBe(published);
    expect(manager.getPlugins()).toEqual([]);
  });

  it('drops Krisp on reprocess once the room no longer allows noise cancellation', async () => {
    const track = makeTrack();
    const room = { isNoiseCancellationEnabled: true } as any;
    const eventBus = new EventBus();
    const failures = collectFailures(eventBus);
    const events: string[] = [];
    eventBus.analytics.subscribe(event => events.push(event.name));
    const manager = new HMSAudioPluginsManager(track, eventBus, room);
    const { plugin } = makePlugin({ name: 'HMSKrispPlugin' });

    await manager.addPlugin(plugin);
    expect(manager.getPlugins()).toEqual(['HMSKrispPlugin']);

    // the template policy turns noise cancellation off, then the mic is switched
    room.isNoiseCancellationEnabled = false;
    await manager.reprocessPlugins();
    // a room policy is a typed failure, not a bare Error the app cannot switch on - which is also
    // what lets it be counted: a bare Error has no toAnalyticsProperties
    expect(failures).toEqual([expect.objectContaining({ code: 7006, name: 'NotAllowedForRoom' })]);
    expect(events).toContain('mediaPlugin.failed');
    // same outcome as an app add being refused: Krisp is stopped, not restarted, nothing published
    expect(plugin.stop).toHaveBeenCalledTimes(1);
    expect(plugin.init).toHaveBeenCalledTimes(1);
    expect(manager.getPlugins()).toEqual([]);
    expect(track.setProcessedTrack).toHaveBeenLastCalledWith(undefined);
  });
});
