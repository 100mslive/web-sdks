import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import { EventBus } from '../../events/EventBus';
import HMSLocalStream from '../streams/HMSLocalStream';
jest.autoMockOn();
jest.mock('./HMSLocalVideoTrack');
const streamId = '123';
const trackId = '456';
const nativeStream = { id: streamId } as MediaStream;

describe('localVideoTrack', () => {
  let stream: HMSLocalStream;
  let videoElement: HTMLVideoElement;
  let track: HMSLocalVideoTrack;
  let nativeTrack: MediaStreamTrack;
  beforeEach(() => {
    videoElement = document.createElement('video');
    stream = new HMSLocalStream(nativeStream);
    nativeTrack = {
      id: trackId,
      kind: 'video',
      enabled: true,
      getSettings: () => ({
        deviceId: 'default',
      }),
    } as MediaStreamTrack;
    track = new HMSLocalVideoTrack(stream, nativeTrack, 'regular', new EventBus());
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn(),
      // Add any method you want to mock
    }));
  });

  test('defaults are good', () => {
    expect(track.trackId).toBe(trackId);
    expect(track.source).toBe('regular');
    expect(track.enabled).toBe(true);
  });

  test('atttach updates sink count', () => {
    track.attach(videoElement);
    console.log(track.hasSinks());
    expect(track.hasSinks()).toBe(true);
  });

  test('detach updates sink count', () => {
    track.detach(videoElement);
    expect(track.hasSinks()).toHaveLastReturnedWith(false);
  });
});
