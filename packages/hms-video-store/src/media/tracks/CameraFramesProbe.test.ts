import { CameraFramesProbe, CameraProbeHost } from './CameraFramesProbe';
import AnalyticsEvent from '../../analytics/AnalyticsEvent';

let nextId = 0;
const fakeTrack = (frames: () => number) =>
  ({
    id: `track-${nextId++}`,
    kind: 'video',
    label: 'camera2 1, facing front',
    readyState: 'live',
    muted: false,
    enabled: true,
    contentHint: '',
    get stats() {
      const total = frames();
      return { deliveredFrames: total, discardedFrames: 0, totalFrames: total };
    },
    getSettings: () => ({ deviceId: 'front', width: 1280, height: 720 }),
    getConstraints: () => ({}),
    getCapabilities: () => ({}),
    stop() {
      (this as { readyState: string }).readyState = 'ended';
    },
  } as unknown as MediaStreamTrack);

const makeHost = (initial: MediaStreamTrack) => {
  const events: AnalyticsEvent[] = [];
  let native = initial;
  const host: CameraProbeHost & { installed: MediaStreamTrack[]; restored: number } = {
    installed: [],
    restored: 0,
    publish: event => events.push(event),
    getNativeTrack: () => native,
    getSender: () => undefined,
    getSinks: () => [],
    getRequestedConstraints: () => ({ width: { ideal: 1280 }, height: { ideal: 720 } }),
    getState: () => ({ enabled: true }),
    isBusy: () => false,
    releaseCamera: () => native.stop(),
    installCameraTrack: async track => {
      host.installed.push(track);
      native = track;
    },
    restoreCamera: async () => {
      host.restored++;
      native = fakeTrack(() => 0);
    },
  };
  return { host, events, phases: () => events.map(event => event.properties.phase) };
};

const setUserMedia = (getUserMedia: jest.Mock) => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia, enumerateDevices: async () => [] },
  });
};

const run = async (ms: number) => {
  await jest.advanceTimersByTimeAsync(ms);
};

describe('CameraFramesProbe', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reports acquire and a summary for a camera delivering frames', async () => {
    let frames = 0;
    const track = fakeTrack(() => (frames += 30));
    const { host, phases } = makeHost(track);
    new CameraFramesProbe(host).watch(track, 'create');
    await run(25000);
    expect(phases()).toEqual(['acquire', 'summary']);
    expect(host.installed).toHaveLength(0);
  });

  it('drops the size constraints for a camera with no frames and stops once frames arrive', async () => {
    const stuck = fakeTrack(() => 0);
    const { host, events, phases } = makeHost(stuck);
    const working = fakeTrack(() => 90);
    const getUserMedia = jest.fn(async () => ({ getVideoTracks: () => [working] }));
    setUserMedia(getUserMedia);
    new CameraFramesProbe(host).watch(stuck, 'create');
    await run(15000);
    expect(phases()).toEqual(['acquire', 'no_frames', 'attempts']);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenCalledWith({ video: { deviceId: { exact: 'front' } } });
    expect(host.installed).toEqual([working]);
    expect(events[2].properties).toEqual(expect.objectContaining({ recovered: true }));
  });

  it('tries portrait when dropping constraints still gives no frames, then restores the camera', async () => {
    const stuck = fakeTrack(() => 0);
    const { host, events } = makeHost(stuck);
    const getUserMedia = jest.fn(async () => {
      const track = fakeTrack(() => 0);
      return { getVideoTracks: () => [track] };
    });
    setUserMedia(getUserMedia);
    new CameraFramesProbe(host).watch(stuck, 'create');
    await run(20000);
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      video: { deviceId: { exact: 'front' }, width: { ideal: 720 }, height: { ideal: 1280 } },
    });
    const attempts = events.find(event => event.properties.phase === 'attempts');
    expect(attempts?.properties.recovered).toBe(false);
    expect((attempts?.properties.results as { arm: string }[]).map(result => result.arm)).toEqual([
      'drop_constraints',
      'portrait',
    ]);
    // the last attempt's track is still live, so it stays rather than being reacquired again
    expect(host.restored).toBe(0);
  });

  it('restores the camera when getUserMedia fails', async () => {
    const stuck = fakeTrack(() => 0);
    const { host, events } = makeHost(stuck);
    setUserMedia(jest.fn().mockRejectedValue(new DOMException('busy', 'NotReadableError')));
    new CameraFramesProbe(host).watch(stuck, 'create');
    await run(15000);
    const attempts = events.find(event => event.properties.phase === 'attempts');
    expect((attempts?.properties.results as { error?: string }[])[0].error).toContain('NotReadableError');
    expect(host.restored).toBe(1);
  });

  it('does not touch the camera while the page is hidden', async () => {
    const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const stuck = fakeTrack(() => 0);
    const { host, phases } = makeHost(stuck);
    const getUserMedia = jest.fn();
    setUserMedia(getUserMedia);
    new CameraFramesProbe(host).watch(stuck, 'create');
    await run(25000);
    expect(phases()).toEqual(['acquire', 'summary']);
    expect(getUserMedia).not.toHaveBeenCalled();
    visibility.mockRestore();
  });

  it('sends a summary for a track replaced before the samples finish', async () => {
    const first = fakeTrack(() => 30);
    const { host, phases } = makeHost(first);
    const probe = new CameraFramesProbe(host);
    probe.watch(first, 'create');
    await run(1500);
    probe.watch(
      fakeTrack(() => 30),
      'reacquire',
    );
    await run(25000);
    expect(phases()).toEqual(['acquire', 'summary', 'acquire', 'summary']);
  });

  it('never throws into the caller', async () => {
    const track = fakeTrack(() => 0);
    const { host } = makeHost(track);
    host.publish = () => {
      throw new Error('transport down');
    };
    host.getState = () => {
      throw new Error('broken state');
    };
    setUserMedia(jest.fn().mockRejectedValue(new Error('nope')));
    expect(() => new CameraFramesProbe(host).watch(track, 'create')).not.toThrow();
    await expect(run(20000)).resolves.toBeUndefined();
  });
});
