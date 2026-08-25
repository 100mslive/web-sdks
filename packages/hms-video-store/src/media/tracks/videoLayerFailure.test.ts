import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

/**
 * The observer callbacks are private, but they are a real entry point - Resize/IntersectionObserver
 * invoke them exactly as these tests do, without awaiting the promise they return.
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
   * remote video mute/unmute via HMSRemoteVideoTrack.setEnabled, so a rejecting layer request
   * there has no caller to catch it. Asserting on the promise updateSinks discards pins that
   * directly - a process-level unhandledRejection spy never fires under jest.
   */
  it('does not reject from the promise updateSinks discards', async () => {
    setPreferredLayer.mockRestore();

    await expect(track.addSink(videoElement, true)).resolves.toBeUndefined();
  });

  /**
   * On-demand tracks start as empty canvas tracks, and addSink takes a branch for them that asks
   * for the layer directly instead of going through updateLayer. That request is what fetches the
   * real track, so it is the one most exposed to an unanswered reply.
   */
  it('does not reject for an empty on-demand track', async () => {
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

    await expect(emptyTrack.addSink(videoElement, true)).resolves.toBeUndefined();
  });
});
