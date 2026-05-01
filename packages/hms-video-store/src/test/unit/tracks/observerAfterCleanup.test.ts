import { VideoElementManager } from '../../../media/tracks/VideoElementManager';
import { HMSRemoteVideoTrack } from '../../../media/tracks/HMSRemoteVideoTrack';
import { HMSRemoteStream } from '../../../media/streams/HMSRemoteStream';
import HMSSubscribeConnection from '../../../connection/subscribe/subscribeConnection';

const makeRemoteVideoTrack = () => {
  const sendOverApiDataChannelWithResponse = jest.fn();
  const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
  const stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
  const nativeTrack = {
    id: 'track-1',
    kind: 'video',
    enabled: true,
    getSettings: jest.fn(() => ({})),
    addEventListener: jest.fn(),
  } as unknown as MediaStreamTrack;
  return new HMSRemoteVideoTrack(stream, nativeTrack, 'regular');
};

describe('VideoElementManager handlers fire after cleanup()', () => {
  it('handleIntersection is a no-op after cleanup() — does not call addSink', async () => {
    const track = makeRemoteVideoTrack();
    const addSinkSpy = jest.spyOn(track, 'addSink').mockResolvedValue(undefined as any);
    const removeSinkSpy = jest.spyOn(track, 'removeSink').mockResolvedValue(undefined as any);

    const manager = new VideoElementManager(track);
    const elem = document.createElement('video');
    await manager.addVideoElement(elem);

    manager.cleanup();
    addSinkSpy.mockClear();
    removeSinkSpy.mockClear();

    const handleIntersection = (manager as any).handleIntersection;
    await handleIntersection({
      target: elem,
      isIntersecting: true,
      boundingClientRect: { width: 640, height: 360 },
    } as unknown as IntersectionObserverEntry);

    expect(addSinkSpy).not.toHaveBeenCalled();
    expect(removeSinkSpy).not.toHaveBeenCalled();
  });
});
