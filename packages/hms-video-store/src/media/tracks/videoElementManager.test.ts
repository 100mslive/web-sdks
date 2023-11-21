import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { EventBus } from '../../events/EventBus';
import { HMSLocalStream } from '../streams/HMSLocalStream';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

const remoteStreamId = '123';
const remoteTrackId = '456';
const localStreamId = '234';
const localTrackId = '567';
let remoteVideoElement!: HTMLVideoElement;
let localVideoElement!: HTMLVideoElement;

describe('videoElementManager', () => {
  let remoteStream: HMSRemoteStream;
  let localStream: HMSLocalStream;
  let sendOverApiDataChannelWithResponse: jest.Mock;
  let remoteTrack: HMSRemoteVideoTrack;
  let localTrack: HMSLocalVideoTrack;
  let localNativeTrack: MediaStreamTrack;
  let remoteNativeTrack: MediaStreamTrack;
  let remoteNativeStream: MediaStream;
  let localNativeStream: MediaStream;

  beforeEach(() => {
    localVideoElement = document.createElement('video');
    remoteVideoElement = document.createElement('video');
    localNativeStream = { id: localStreamId } as MediaStream;
    const publishConnection = {} as unknown as HMSPublishConnection;
    localStream = new HMSLocalStream(localNativeStream);
    localStream.setConnection(publishConnection);
    localNativeTrack = {
      id: localTrackId,
      kind: 'video',
      enabled: true,
      getSettings: jest.fn(() => ({})),
    } as unknown as MediaStreamTrack;
    localTrack = new HMSLocalVideoTrack(localStream, localNativeTrack, 'regular', new EventBus());

    sendOverApiDataChannelWithResponse = jest.fn();
    const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
    remoteNativeStream = { id: remoteStreamId } as MediaStream;
    remoteStream = new HMSRemoteStream(remoteNativeStream, connection);
    remoteNativeTrack = { id: remoteTrackId, kind: 'video', enabled: true } as MediaStreamTrack;
    remoteTrack = new HMSRemoteVideoTrack(remoteStream, remoteNativeTrack, 'regular');
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn(),
      // Add any method you want to mock
    }));
  });

  test('local video defaults are good', () => {
    expect(localTrack.trackId).toBe(localTrackId);
  });

  test('local video track attach adds element to videoElementManager', () => {
    localTrack.attach(localVideoElement);
    expect(localTrack.getSinks().length).toBe(1);
    localTrack.attach(localVideoElement);
    // same element should not update sinks
    expect(localTrack.getSinks().length).toBe(1);
    localTrack.attach(document.createElement('video'));
    expect(localTrack.getSinks().length).toBe(2);
  });

  test('remote video defaults are good', () => {
    expect(remoteTrack.trackId).toBe(remoteTrackId);
  });

  test('remote video track attach add element to videoElementManager', () => {
    remoteTrack.attach(remoteVideoElement);
    expect(remoteTrack.getSinks().length).toBe(1);
    remoteTrack.attach(remoteVideoElement);
    // same element should not update sinks
    expect(remoteTrack.getSinks().length).toBe(1);
    remoteTrack.attach(document.createElement('video'));
    expect(remoteTrack.getSinks().length).toBe(2);
  });

  test('test cleanup', async () => {
    const track = localTrack;
    const videoElement1 = document.createElement('video');
    const videoElement2 = document.createElement('video');
    await track.videoHandler.addVideoElement(videoElement1);
    await track.videoHandler.addVideoElement(videoElement2);
    expect(track.videoHandler.getVideoElements().length).toBe(2);
    track.videoHandler.cleanup();
    expect(track.videoHandler.getVideoElements().length).toBe(0);
  });
});
