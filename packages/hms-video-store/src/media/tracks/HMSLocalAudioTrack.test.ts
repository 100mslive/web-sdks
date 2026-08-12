import HMSPublishConnection from '../../connection/publish/publishConnection';
import { EventBus } from '../../events/EventBus';
import { HMSLocalAudioTrack, HMSLocalStream } from '../../internal';
import { isMobile } from '../../utils/support';
import { getAudioTrack } from '../../utils/track';
import { HMSAudioTrackSettingsBuilder } from '../settings';

jest.mock('../../utils/track', () => ({
  ...jest.requireActual('../../utils/track'),
  getAudioTrack: jest.fn(),
}));

jest.mock('../../utils/support', () => ({
  ...jest.requireActual('../../utils/support'),
  isMobile: jest.fn(() => false),
}));

const getAudioTrackMock = getAudioTrack as jest.Mock;
const isMobileMock = isMobile as jest.Mock;

const audioContext = {
  createMediaStreamSource: jest.fn(),
  createMediaStreamDestination: jest.fn(),
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

const makeLocalAudioTrack = (eventBus: EventBus) => {
  const nativeStream = {
    id: 'stream-1',
    getTracks: () => [],
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
  } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const settings = new HMSAudioTrackSettingsBuilder().build();
  return new HMSLocalAudioTrack(stream, makeNativeTrack('track-1'), 'regular', eventBus, settings);
};

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

describe('HMSLocalAudioTrack interruptions', () => {
  beforeEach(() => {
    setVisibility('visible');
    audioContext.resume.mockClear();
    getAudioTrackMock.mockReset();
    getAudioTrackMock.mockImplementation(async () => makeNativeTrack('track-2'));
    isMobileMock.mockReturnValue(false);
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
    isMobileMock.mockReturnValue(true);

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
