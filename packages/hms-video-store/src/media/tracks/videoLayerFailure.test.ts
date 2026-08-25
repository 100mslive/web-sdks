import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import HMSLogger from '../../utils/logger';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

/**
 * The observer callbacks are private, but they are a real entry point - Resize/IntersectionObserver
 * call them and discard the promise they return, which is how a rejection escapes. The tests await
 * it instead, so a rejection becomes a failing assertion. The resize path is debounced in
 * production; calling the handler directly skips that.
 */
interface ObserverHandlers {
  handleResize: (entry: ResizeObserverEntry) => Promise<void>;
  handleIntersection: (entry: IntersectionObserverEntry) => Promise<void>;
}

const handlersOf = (manager: VideoElementManager) => manager as unknown as ObserverHandlers;

/**
 * A lost `prefer-video-track-state` reply makes requestLayer throw. The resize and
 * intersection handlers are handed to observers, which never await them, so a throw
 * there escapes as an unhandled rejection.
 */
describe('VideoElementManager layer request failures', () => {
  let track: HMSRemoteVideoTrack;
  let manager: VideoElementManager;
  let videoElement: HTMLVideoElement;
  let setPreferredLayer: jest.SpyInstance;

  beforeEach(() => {
    videoElement = document.createElement('video');
    window.MediaStream = jest.fn().mockImplementation(() => ({ addTrack: jest.fn() })) as unknown as typeof MediaStream;
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const connection = {
      sendOverApiDataChannelWithResponse: jest
        .fn()
        .mockRejectedValue(new Error('No response from SFU for prefer-video-track-state')),
    } as unknown as HMSSubscribeConnection;
    const stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
    const nativeTrack = {
      id: 'track-1',
      kind: 'video',
      enabled: true,
      addEventListener: jest.fn(),
    } as unknown as MediaStreamTrack;
    track = new HMSRemoteVideoTrack(stream, nativeTrack, 'regular');
    manager = new VideoElementManager(track);
    manager.addVideoElement(videoElement);
    setPreferredLayer = jest
      .spyOn(track, 'setPreferredLayer')
      .mockRejectedValue(new Error('No response from SFU for prefer-video-track-state'));
  });

  afterEach(() => {
    manager.cleanup();
    jest.restoreAllMocks();
  });

  // built per-test: videoElement is only assigned in beforeEach
  const resizeEntry = () =>
    ({ target: videoElement, contentRect: { width: 640, height: 360 } } as unknown as ResizeObserverEntry);

  const intersectionEntry = () =>
    ({
      target: videoElement,
      isIntersecting: true,
      boundingClientRect: { width: 640, height: 360 },
    } as unknown as IntersectionObserverEntry);

  it('does not reject from the resize handler when the layer request fails', async () => {
    await expect(handlersOf(manager).handleResize(resizeEntry())).resolves.toBeUndefined();
    expect(setPreferredLayer).toHaveBeenCalled();
  });

  it('does not reject from the intersection handler when the layer request fails', async () => {
    await expect(handlersOf(manager).handleIntersection(intersectionEntry())).resolves.toBeUndefined();
  });

  /**
   * addSink is what assigns srcObject. Selecting a layer is an optimisation on top of that, so a
   * failed layer request must not stop the element being attached - that leaves a blank tile.
   */
  it('still attaches the sink when the layer request fails', async () => {
    const addSink = jest.spyOn(track, 'addSink');

    await handlersOf(manager).handleIntersection(intersectionEntry());

    expect(addSink).toHaveBeenCalledWith(videoElement);
  });

  /**
   * updateSinks is sync and discards the promises from addSink/removeSink, and it runs on every
   * remote video mute/unmute via HMSRemoteVideoTrack.setEnabled, so a rejecting layer request there
   * has no caller to catch it. The swallow lives at this discard point, not inside the track.
   */
  it('logs and swallows the promise updateSinks discards', async () => {
    setPreferredLayer.mockRestore();
    const logError = jest.spyOn(HMSLogger, 'e').mockImplementation(() => undefined);

    manager.updateSinks(true);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(logError).toHaveBeenCalled();
  });

  /**
   * addSink itself must keep rejecting: attachVideo with autoManageVideo: false awaits it, and on
   * the empty-track branch nothing is attached, so swallowing there would report a failed attach
   * as success.
   */
  it('still rejects from addSink so awaiting callers see the failure', async () => {
    setPreferredLayer.mockRestore();

    await expect(track.addSink(videoElement, true)).rejects.toThrow('No response from SFU');
  });

  it('still rejects from addSink for an empty on-demand track', async () => {
    setPreferredLayer.mockRestore();
    const emptyTrack = new HMSRemoteVideoTrack(
      track.stream as HMSRemoteStream,
      {
        id: 'empty-1',
        kind: 'video',
        enabled: true,
        label: '',
        addEventListener: jest.fn(),
      } as unknown as MediaStreamTrack,
      'regular',
    );

    await expect(emptyTrack.addSink(videoElement, true)).rejects.toThrow('No response from SFU');
  });
});
