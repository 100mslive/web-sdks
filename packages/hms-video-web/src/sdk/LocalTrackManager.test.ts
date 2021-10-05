import { LocalTrackManager } from './LocalTrackManager';
import { Store } from './store';
import ITransportObserver from '../transport/ITransportObserver';
import { HMSRemoteVideoTrack, HMSTrack } from '../media/tracks';
import { HMSException } from '../error/HMSException';
import { TransportState } from '../transport/models/TransportState';
import { DeviceManager } from '../device-manager';
import { PublishParams } from '..';

const testObserver: ITransportObserver = {
  onNotification(_: Object): void {},

  onTrackAdd(_: HMSTrack): void {},

  onTrackRemove(_: HMSTrack): void {},

  onTrackDegrade(_: HMSRemoteVideoTrack): void {},

  onTrackRestore(_: HMSRemoteVideoTrack): void {},

  onFailure(_: HMSException): void {},

  async onStateChange(_: TransportState, __?: HMSException): Promise<void> {},
};

const testStore = new Store();

const hostPublishParams: PublishParams = {
  allowed: ['audio', 'video', 'screen'],
  audio: {
    bitRate: 32,
    codec: 'opus',
  },
  video: {
    bitRate: 400,
    codec: 'vp8',
    frameRate: 30,
    width: 640,
    height: 480,
  },
  screen: {
    codec: 'vp8',
    frameRate: 10,
    width: 1920,
    height: 1080,
    bitRate: 400,
  },
  videoSimulcastLayers: {
    layers: [],
  },
  screenSimulcastLayers: {
    layers: [],
  },
};

const mockGetUserMedia = jest.fn((_) =>
  Promise.resolve({
    getVideoTracks: jest.fn(() => [{ id: 'video-id', kind: 'video' }]),
    getAudioTracks: jest.fn(() => [{ id: 'audio-id', kind: 'audio' }]),
  }),
);

const mockEnumerateDevices = jest.fn(() =>
  Promise.resolve([
    { kind: 'audioinput', deviceId: 'audio-device-id', label: 'audioInputLabel' },
    { kind: 'videoinput', deviceId: 'video-device-id', label: undefined },
    { kind: 'audiooutput', deviceId: 'audio-output-device-id', label: 'audioOutputLabel' },
  ]),
);

const mockMediaDevices = {
  getUserMedia: mockGetUserMedia,
  enumerateDevices: mockEnumerateDevices,
};

// @ts-ignore
global.navigator.mediaDevices = mockMediaDevices;

const mockMediaStream = { id: 'native-stream-id' };
global.MediaStream = jest.fn().mockImplementation(() => mockMediaStream);

describe('LocalTrackManager', () => {
  it('instantiates without any issues', () => {
    const manager = new LocalTrackManager(testStore, testObserver, new DeviceManager(testStore));
    expect(manager).toBeDefined();
  });

  it('passes the right constrainst based on publish params', async () => {
    global.navigator = {
      mediaDevices: {
        enumerateDevices: mockEnumerateDevices,
        getUserMedia: mockGetUserMedia,
      },
      something: 2,
    } as any;

    const manager = new LocalTrackManager(testStore, testObserver, new DeviceManager(testStore));
    testStore.setPublishParams(hostPublishParams);
    await manager.getTracksToPublish({});

    const constraints = mockGetUserMedia.mock.calls[0][0];

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
    expect(constraints).toHaveProperty('audio');
    expect(constraints).toHaveProperty('video');
  });
});
