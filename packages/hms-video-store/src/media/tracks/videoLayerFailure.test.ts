import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

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
    const connection = { sendOverApiDataChannelWithResponse: jest.fn() } as unknown as HMSSubscribeConnection;
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

  const resizeEntry = {
    target: videoElement,
    contentRect: { width: 640, height: 360 },
  } as unknown as ResizeObserverEntry;

  it('does not reject from the resize handler when the layer request fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResize = (manager as any).handleResize as (entry: ResizeObserverEntry) => Promise<void>;

    await expect(
      handleResize({ ...resizeEntry, target: videoElement } as ResizeObserverEntry),
    ).resolves.toBeUndefined();
    expect(setPreferredLayer).toHaveBeenCalled();
  });
});
