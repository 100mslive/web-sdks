import HMSPublishConnection from '../../connection/publish/publishConnection';
import { ErrorCodes } from '../../error/ErrorCodes';
import { EventBus } from '../../events/EventBus';
import { HMSLocalAudioTrack, HMSLocalStream } from '../../internal';
import { HMSAudioPluginType } from '../../plugins';
import Room from '../../sdk/models/HMSRoom';
import { isMobileOrTablet } from '../../utils/support';
import { getAudioTrack } from '../../utils/track';
import { HMSAudioTrackSettingsBuilder } from '../settings';

jest.mock('../../utils/track', () => ({
  ...jest.requireActual('../../utils/track'),
  getAudioTrack: jest.fn(),
}));

jest.mock('../../utils/support', () => ({
  ...jest.requireActual('../../utils/support'),
  isMobileOrTablet: jest.fn(() => false),
}));

const getAudioTrackMock = getAudioTrack as jest.Mock;
const isMobileOrTabletMock = isMobileOrTablet as jest.Mock;

const audioContext = {
  sampleRate: 48000,
  createMediaStreamSource: jest.fn(),
  createMediaStreamDestination: jest.fn(),
  createOscillator: jest.fn(() => ({ connect: jest.fn(), start: jest.fn() })),
  resume: jest.fn(async () => {}),
};

// jsdom has no AudioContext, HMSAudioPluginsManager creates one in the constructor
beforeAll(() => {
  (global as any).AudioContext = jest.fn(() => audioContext);
});

/**
 * An interrupted track on iOS comes back reporting live and unmuted while its capture unit stays
 * stopped - which is exactly what this fake reports, so recovery here can only come from the
 * interruption itself and not from the track flags.
 */
const makeNativeTrack = (id: string) =>
  ({
    id,
    kind: 'audio',
    label: 'Fake mic',
    enabled: true,
    muted: false,
    readyState: 'live',
    getSettings: jest.fn(() => ({ deviceId: 'mic-1' })),
    getConstraints: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    stop: jest.fn(),
  } as unknown as MediaStreamTrack);

const makeLocalAudioTrack = (
  eventBus: EventBus,
  source = 'regular',
  nativeTrack: MediaStreamTrack = makeNativeTrack('track-1'),
  room?: Room,
) => {
  const nativeStream = {
    id: 'stream-1',
    getTracks: () => [],
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
  } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const settings = new HMSAudioTrackSettingsBuilder().build();
  return new HMSLocalAudioTrack(stream, nativeTrack, source, eventBus, settings, room);
};

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

const setMicPermission = (state?: PermissionState) => {
  Object.defineProperty(navigator, 'permissions', {
    value: state ? { query: jest.fn(async () => ({ state, onchange: null })) } : undefined,
    configurable: true,
  });
};

const listenedEvents = (nativeTrack: MediaStreamTrack) =>
  (nativeTrack.addEventListener as jest.Mock).mock.calls.map(([name]) => name);

// navigator.permissions resolves on a task, not a microtask
const flushPermissionQuery = () => new Promise(resolve => setTimeout(resolve, 0));

describe('HMSLocalAudioTrack interruptions', () => {
  beforeEach(() => {
    setVisibility('visible');
    audioContext.resume.mockClear();
    getAudioTrackMock.mockReset();
    getAudioTrackMock.mockImplementation(async () => makeNativeTrack('track-2'));
    isMobileOrTabletMock.mockReturnValue(false);
  });

  it('publishes an interruption on native mute and unmute', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean; reason: string; trackId: string }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(interruptions).toEqual([
      { started: true, reason: 'track-muted-natively', type: 'audio', trackId: track.trackId },
      { started: false, reason: 'track-unmuted-natively', type: 'audio', trackId: track.trackId },
    ]);
  });

  // the names are read by consumers of the analytics stream, an interruption is only countable
  // while the pair stays intact
  it('reports the interruption to analytics as interruption.start and interruption.stop', async () => {
    const eventBus = new EventBus();
    const names: string[] = [];
    eventBus.analytics.subscribe(event => names.push(event.name));

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(names.filter(name => name.startsWith('interruption'))).toEqual(['interruption.start', 'interruption.stop']);
  });

  it('reacquires the mic on interruption end even though the track reports live and unmuted', async () => {
    const track = makeLocalAudioTrack(new EventBus());

    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(getAudioTrackMock).toHaveBeenCalledTimes(1);
    expect(track.nativeTrack.id).toBe('track-2');
    // plugins publish the destination node of this context, iOS leaves it suspended
    expect(audioContext.resume).toHaveBeenCalled();
  });

  it('re-publishes the enabled state on recovery so remote peers resubscribe', async () => {
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localAudioEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));
    const unpaused = jest.fn();
    eventBus.localAudioUnmutedNatively.subscribe(unpaused);

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    // mute tells biz the peer is muted, recovery has to take that back
    expect(enabledUpdates).toEqual([false, true]);
    expect(unpaused).toHaveBeenCalledTimes(1);
  });

  // the cohort that never recovers today: the native unmute never arrives, the foreground event is
  // the only trigger left
  it('recovers from the foreground event alone when no native unmute arrives', async () => {
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localAudioEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));
    const unpaused = jest.fn();
    eventBus.localAudioUnmutedNatively.subscribe(unpaused);

    const track = makeLocalAudioTrack(eventBus);
    setVisibility('hidden');
    (track as any).handleTrackMute();
    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(getAudioTrackMock).toHaveBeenCalledTimes(1);
    expect(enabledUpdates).toEqual([false, true]);
    expect(unpaused).toHaveBeenCalledTimes(1);
  });

  // an interruption the user was never present for and that fixed itself is not worth a prompt
  it('defers recovery on mobile while the page is hidden and recovers on foreground without prompting', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    isMobileOrTabletMock.mockReturnValue(true);

    const track = makeLocalAudioTrack(eventBus);
    setVisibility('hidden');
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(getAudioTrackMock).not.toHaveBeenCalled();
    expect(interruptions).toEqual([]);

    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(getAudioTrackMock).toHaveBeenCalledTimes(1);
    expect(interruptions).toEqual([]);
  });

  /**
   * Only mobile withholds capture from a hidden page. On desktop a backgrounded tab is still a tab
   * that can call getUserMedia, and waiting for a foreground that may be a long way off would leave
   * the mic dead - and the peer published as muted - for the whole time.
   */
  it('recovers immediately on desktop even though the page is hidden', async () => {
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localAudioEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));

    const track = makeLocalAudioTrack(eventBus);
    setVisibility('hidden');
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(getAudioTrackMock).toHaveBeenCalledTimes(1);
    // and the peer is published as unmuted again, not left muted until the tab is focused
    expect(enabledUpdates).toEqual([false, true]);
  });

  // the mic is back, however it got back - the prompt cannot outlive it
  it('ends the interruption when the user recovers the mic themselves', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    expect(interruptions.map(i => i.started)).toEqual([true]);

    await track.setEnabled(false);
    await track.setEnabled(true);

    expect(interruptions.map(i => i.started)).toEqual([true, false]);
  });

  /**
   * A peer that joined muted holds an empty track, which reports itself as needing reacquisition for
   * the whole session, and its mic permission was never granted. Nothing was taken away from them.
   */
  it('does not prompt a peer that joined muted with the mic permission ungranted', async () => {
    const eventBus = new EventBus();
    const interruptions: unknown[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalAudioTrack(eventBus);
    // the empty track LocalTrackManager installs for a muted join
    (track.nativeTrack as any).label = 'MediaStreamAudioDestinationNode';
    (track.nativeTrack as any).enabled = false;
    (track as any).permissionState = 'prompt';

    setVisibility('hidden');
    await (track as any).handleVisibilityChange();
    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(interruptions).toEqual([]);
  });

  /**
   * The prompt is gated on the mic actually publishing, the analytics are not. An interruption is
   * only countable while the pair stays intact, so a start has to be recorded wherever the foreground
   * will send its stop - including for a peer who is muted and never sees a prompt.
   */
  it('keeps the analytics pair intact for a muted peer that gets no prompt', async () => {
    const eventBus = new EventBus();
    const names: string[] = [];
    const interruptions: unknown[] = [];
    eventBus.analytics.subscribe(event => {
      if (event.name.startsWith('interruption.')) {
        names.push(event.name);
      }
    });
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));

    const track = makeLocalAudioTrack(eventBus);
    (track.nativeTrack as any).label = 'MediaStreamAudioDestinationNode';
    (track.nativeTrack as any).enabled = false;

    setVisibility('hidden');
    await (track as any).handleVisibilityChange();
    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(names).toEqual(['interruption.start', 'interruption.stop']);
    expect(interruptions).toEqual([]);
  });

  // getUserMedia resolving is not proof of capture - iOS hands back a muted track mid-interruption
  it('does not end the interruption when the reacquired mic is still not capturing', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    getAudioTrackMock.mockImplementation(async () => {
      const replacement = makeNativeTrack('track-2');
      (replacement as any).muted = true;
      return replacement;
    });

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(interruptions.map(i => i.started)).toEqual([true]);
  });

  it('prompts on foreground when the mic did not come back', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean; reason: string }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    // eventemitter2 rethrows the reserved 'error' event when nothing is listening
    eventBus.error.subscribe(() => {});
    getAudioTrackMock.mockRejectedValue(new Error('device in use'));

    const track = makeLocalAudioTrack(eventBus);
    setVisibility('hidden');
    (track as any).handleTrackMute();
    (track.nativeTrack as any).readyState = 'ended';

    setVisibility('visible');
    await (track as any).handleVisibilityChange();

    expect(interruptions).toEqual([
      { started: true, reason: 'visibility-change', type: 'audio', trackId: track.trackId },
    ]);
  });

  it('recovers once when the native unmute and the foreground event both fire', async () => {
    const track = makeLocalAudioTrack(new EventBus());

    (track as any).handleTrackMute();
    await Promise.all([track.handleTrackUnmute(), (track as any).handleVisibilityChange()]);

    expect(getAudioTrackMock).toHaveBeenCalledTimes(1);
  });

  it('does not end the interruption when the track fails to recover', async () => {
    const eventBus = new EventBus();
    const interruptions: { started: boolean }[] = [];
    eventBus.trackInterruption.subscribe(interruption => interruptions.push(interruption));
    // eventemitter2 rethrows the reserved 'error' event when nothing is listening
    eventBus.error.subscribe(() => {});
    getAudioTrackMock.mockRejectedValue(new Error('device in use'));

    const track = makeLocalAudioTrack(eventBus);
    (track as any).handleTrackMute();
    await track.handleTrackUnmute();

    expect(interruptions.map(i => i.started)).toEqual([true]);
  });
});

/**
 * The same wiring as the video track, and the same defect for the same reason - a screenshare is
 * not a capture device this SDK owns, so a mute published for it never gets taken back. LIV-646.
 */
describe('HMSLocalAudioTrack screenshare', () => {
  afterEach(() => setMicPermission(undefined));

  it('does not listen for native mute and unmute on a screenshare audio track', () => {
    const nativeTrack = makeNativeTrack('track-1');
    makeLocalAudioTrack(new EventBus(), 'screen', nativeTrack);

    expect(listenedEvents(nativeTrack)).not.toContain('mute');
    expect(listenedEvents(nativeTrack)).not.toContain('unmute');
  });

  it('listens for native mute and unmute on a mic track', () => {
    const nativeTrack = makeNativeTrack('track-1');
    makeLocalAudioTrack(new EventBus(), 'regular', nativeTrack);

    expect(listenedEvents(nativeTrack)).toEqual(expect.arrayContaining(['mute', 'unmute']));
  });

  it('does not mute screenshare audio when the microphone permission is denied', async () => {
    setMicPermission('denied');
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localAudioEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));

    makeLocalAudioTrack(eventBus, 'screen');
    await flushPermissionQuery();

    expect(enabledUpdates).toEqual([]);
  });

  it('mutes the mic when the microphone permission is denied', async () => {
    setMicPermission('denied');
    const eventBus = new EventBus();
    const enabledUpdates: boolean[] = [];
    eventBus.localAudioEnabled.subscribe(({ enabled }) => enabledUpdates.push(enabled));

    makeLocalAudioTrack(eventBus, 'regular');
    await flushPermissionQuery();

    expect(enabledUpdates).toEqual([false]);
  });
});

// Model graph connections and ended capture, so publishing a live but unfed destination fails.
describe('HMSLocalAudioTrack device switches with active noise cancellation', () => {
  const makeCapturingTrack = (id: string) => {
    const track = makeNativeTrack(id);
    (track.stop as jest.Mock).mockImplementation(() => ((track as any).readyState = 'ended'));
    return track;
  };
  const makeNode = (source?: MediaStreamTrack) => {
    const node = {
      context: audioContext,
      source,
      inputs: new Set<any>(),
      outputs: new Set<any>(),
      connect(target: any) {
        node.outputs.add(target);
        target.inputs.add(node);
      },
      disconnect() {
        node.outputs.forEach(target => target.inputs.delete(node));
        node.outputs.clear();
      },
    };
    return node;
  };
  const hasLiveAudio = (node: ReturnType<typeof makeNode>): boolean =>
    node.source ? node.source.readyState === 'live' : Array.from(node.inputs).some(hasLiveAudio);

  const setup = () => {
    const eventBus = new EventBus();
    const room = { isNoiseCancellationEnabled: true } as Room;
    const track = makeLocalAudioTrack(eventBus, 'regular', makeCapturingTrack('mic-1'), room);
    const sender = {
      track: undefined as any,
      replaceTrack: jest.fn(async (replacement: MediaStreamTrack) => {
        await Promise.resolve();
        sender.track = replacement;
      }),
    };
    track.transceiver = { direction: 'sendonly', sender } as unknown as RTCRtpTransceiver;
    let activeNode: ReturnType<typeof makeNode> | undefined;
    const plugin = {
      getName: () => 'HMSKrispPlugin',
      getPluginType: () => HMSAudioPluginType.TRANSFORM,
      checkSupport: () => ({ isSupported: true }),
      isSupported: () => true,
      init: jest.fn(async () => {}),
      processAudioTrack: jest.fn(async (_context: AudioContext, source: any) => {
        activeNode = makeNode();
        source.connect(activeNode);
        return activeNode as unknown as AudioNode;
      }),
      stop: jest.fn(() => {
        activeNode?.disconnect();
        activeNode = undefined;
      }),
    };
    return { track, sender, plugin, eventBus };
  };

  beforeEach(() => {
    (global as any).MediaStream = jest.fn(tracks => ({ tracks }));
    audioContext.createMediaStreamSource.mockImplementation(stream => makeNode(stream.tracks[0]));
    audioContext.createMediaStreamDestination.mockImplementation(() => {
      const destination = makeNode();
      const output = Object.assign(makeCapturingTrack('processed'), { graph: destination });
      return { ...destination, stream: { getAudioTracks: () => [output] } };
    });
    getAudioTrackMock.mockReset();
    getAudioTrackMock.mockImplementation(async settings => makeCapturingTrack(settings.deviceId));
  });

  it('rebuilds from recovered capture while preserving the original device error', async () => {
    const { track, sender, plugin } = setup();
    try {
      await track.addPlugin(plugin);
      expect(hasLiveAudio(sender.track.graph)).toBe(true);
      const error = new Error('device unavailable');
      getAudioTrackMock.mockRejectedValueOnce(error).mockResolvedValueOnce(makeCapturingTrack('fallback'));

      await expect(track.setSettings({ deviceId: 'unavailable' })).rejects.toBe(error);
      expect(track.nativeTrack.id).toBe('fallback');
      expect(sender.track).toBe(track.getTrackBeingSent());
      expect(hasLiveAudio(sender.track.graph)).toBe(true);
      expect(plugin.init).toHaveBeenCalledTimes(2);
    } finally {
      await track.cleanup();
    }
  });

  it('keeps recovered native audio live if rebuilding the plugin also fails', async () => {
    const { track, sender, plugin, eventBus } = setup();
    const failed = jest.fn();
    eventBus.audioPluginFailed.subscribe(failed);
    try {
      await track.addPlugin(plugin);
      const error = new Error('device unavailable');
      const pluginError = new Error('filter creation failed');
      getAudioTrackMock.mockRejectedValueOnce(error).mockResolvedValueOnce(makeCapturingTrack('fallback'));
      plugin.processAudioTrack.mockRejectedValueOnce(pluginError);

      await expect(track.setSettings({ deviceId: 'unavailable' })).rejects.toBe(error);
      expect(sender.track).toBe(track.nativeTrack);
      expect(sender.track.readyState).toBe('live');
      // the app gets a coded error it can switch on, not a bare Error with an undefined description
      expect(failed).toHaveBeenCalledWith(expect.objectContaining({ code: 7003, description: pluginError.message }));
      expect(track.getPlugins()).toEqual([]);
    } finally {
      await track.cleanup();
    }
  });

  it('rebuilds the graph on the mic reacquired after an interruption', async () => {
    setVisibility('visible');
    isMobileOrTabletMock.mockReturnValue(false);
    const { track, sender, plugin } = setup();
    try {
      await track.addPlugin(plugin);
      const interruptedTrack = track.nativeTrack;

      // the trigger this PR was reported against: an OS interruption, not a device change
      (track as any).handleTrackMute();
      await track.handleTrackUnmute();

      // recovery re-acquires the same device, so this is a different track with the same id
      expect(track.nativeTrack).not.toBe(interruptedTrack);
      expect(interruptedTrack.readyState).toBe('ended');
      expect(plugin.init).toHaveBeenCalledTimes(2);
      expect(plugin.processAudioTrack).toHaveBeenLastCalledWith(
        audioContext,
        expect.objectContaining({ source: track.nativeTrack }),
      );
      expect(sender.track).toBe(track.getTrackBeingSent());
      expect(hasLiveAudio(sender.track.graph)).toBe(true);
    } finally {
      await track.cleanup();
    }
  });

  it('does not run the plugins against the silent track installed when capture is denied', async () => {
    const { track, sender, plugin } = setup();
    try {
      await track.addPlugin(plugin);
      const denied = Object.assign(new Error('permission denied'), {
        code: ErrorCodes.TracksErrors.SYSTEM_DENIED_PERMISSION,
      });
      getAudioTrackMock.mockRejectedValueOnce(denied);
      // LocalTrackManager.getEmptyAudioTrack builds its track off this same context
      const empty = Object.assign(makeCapturingTrack('empty'), { label: 'MediaStreamAudioDestinationNode' });
      audioContext.createMediaStreamDestination.mockImplementationOnce(() => ({
        ...makeNode(),
        stream: { getAudioTracks: () => [empty] },
      }));

      await expect(track.setSettings({ deviceId: 'denied' })).rejects.toBe(denied);

      // the empty track is a deliberately silent oscillator: a Krisp init against it only delays
      // the device error the app is waiting for, and the graph still up reads the mic that is gone
      expect(track.nativeTrack).toBe(empty);
      expect(plugin.init).toHaveBeenCalledTimes(1);
      expect(plugin.stop).toHaveBeenCalled();
      expect(track.getPlugins()).toEqual(['HMSKrispPlugin']);
      expect(sender.track).toBe(empty);
      expect(track.getTrackBeingSent()).toBe(empty);
    } finally {
      await track.cleanup();
    }
  });

  it.each(['init', 'processAudioTrack'] as const)(
    'publishes the latest live microphone after three overlapping switches during %s',
    async pendingStep => {
      const { track, sender, plugin } = setup();
      let release!: () => void;
      const pending = new Promise<void>(resolve => (release = resolve));
      const switches: Promise<void>[] = [];
      try {
        await track.addPlugin(plugin);
        expect(hasLiveAudio(sender.track.graph)).toBe(true);
        if (pendingStep === 'init') {
          plugin.init.mockImplementationOnce(() => pending);
        } else {
          const process = plugin.processAudioTrack.getMockImplementation()!;
          plugin.processAudioTrack.mockImplementationOnce(async (context, source) => {
            await pending;
            return process(context, source);
          });
        }

        for (const deviceId of ['mic-2', 'mic-3', 'mic-4']) {
          switches.push(track.setSettings({ deviceId }));
          await new Promise(resolve => setTimeout(resolve, 0));
          expect(sender.track).toBe(track.nativeTrack);
          expect(sender.track.id).toBe(deviceId);
          expect(sender.track.readyState).toBe('live');
        }
        // The queued switches must not stop a plugin whose rebuild is still pending.
        expect(plugin.stop).toHaveBeenCalledTimes(1);
        release();
        await Promise.all(switches);

        expect(track.nativeTrack.id).toBe('mic-4');
        expect(sender.track).toBe(track.getTrackBeingSent());
        expect(sender.track.readyState).toBe('live');
        expect(hasLiveAudio(sender.track.graph)).toBe(true);
        expect(plugin.processAudioTrack).toHaveBeenLastCalledWith(
          audioContext,
          expect.objectContaining({ source: track.nativeTrack }),
        );
        expect(plugin.init).toHaveBeenCalledTimes(4);
      } finally {
        release();
        await Promise.allSettled(switches);
        await track.cleanup();
      }
    },
  );
});
