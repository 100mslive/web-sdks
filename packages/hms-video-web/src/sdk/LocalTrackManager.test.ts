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

const mockMediaStream = {
  id: 'native-stream-id',
  getVideoTracks: jest.fn(() => [{ id: 'video-id', kind: 'video' }]),
  getAudioTracks: jest.fn(() => [{ id: 'audio-id', kind: 'audio' }]),
};

const gumSuccess = (_: any) => Promise.resolve(mockMediaStream);

const gumError = (_: any) => Promise.reject(new Error('Permission denied'));

const mockGetUserMedia = jest.fn(gumSuccess).mockName('GUM Success');

const mockDenyGetUserMedia = jest
  .fn()
  .mockImplementationOnce(gumError)
  .mockImplementation(gumSuccess)
  .mockName('Deny GUM');

const mockDevices = [
  { kind: 'audioinput', deviceId: 'audio-device-id', label: 'audioInputLabel' },
  { kind: 'videoinput', deviceId: 'video-device-id', label: 'videoInputLabel' },
  { kind: 'audiooutput', deviceId: 'audio-output-device-id', label: 'audioOutputLabel' },
];

const mockEnumerateDevices = ({ videoInput = true, audioInput = true } = {}) =>
  jest.fn(() =>
    Promise.resolve(
      mockDevices.map((device) => ({
        ...device,
        label:
          (!videoInput && device.kind === 'videoinput') || (!audioInput && device.kind === 'audioinput')
            ? ''
            : device.label,
      })),
    ),
  );

const mockMediaDevices = {
  getUserMedia: mockGetUserMedia,
  enumerateDevices: mockEnumerateDevices(),
};

// @ts-ignore
global.navigator.mediaDevices = mockMediaDevices;
global.MediaStream = jest.fn().mockImplementation(() => mockMediaStream);

const mockAudioContext = {
  createOscillator() {
    return {
      connect: (x: any) => x,
      start() {},
    };
  },
  createMediaStreamDestination() {
    return {
      stream: {
        getAudioTracks: jest.fn(() => [{ id: 'audio-id', kind: 'audio' }]),
      },
    };
  },
};
global.AudioContext = jest.fn(() => mockAudioContext) as any;

describe('LocalTrackManager', () => {
  beforeAll(() => {
    const createElement = document.createElement.bind(document);
    document.createElement = (tagName: any) => {
      if (tagName === 'canvas') {
        const element = createElement(tagName);
        element.captureStream = jest.fn(() => mockMediaStream);
        return element;
      }
      return createElement(tagName);
    };
  });

  it('instantiates without any issues', () => {
    const manager = new LocalTrackManager(testStore, testObserver, new DeviceManager(testStore));
    expect(manager).toBeDefined();
  });

  it('passes the right constraints based on publish params', async () => {
    global.navigator = {
      mediaDevices: {
        enumerateDevices: mockEnumerateDevices(),
        getUserMedia: mockGetUserMedia,
      },
    } as any;

    const manager = new LocalTrackManager(testStore, testObserver, new DeviceManager(testStore));
    testStore.setPublishParams(hostPublishParams);
    await manager.getTracksToPublish({});

    const constraints = mockGetUserMedia.mock.calls[0][0];

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
    expect(constraints).toHaveProperty('audio');
    expect(constraints).toHaveProperty('video');
  });

  describe('handling permission failures', () => {
    let failureCallback = jest.spyOn(testObserver, 'onFailure');
    let manager: LocalTrackManager;

    beforeEach(() => {
      manager = new LocalTrackManager(testStore, testObserver, new DeviceManager(testStore));
      global.navigator.mediaDevices.getUserMedia = mockDenyGetUserMedia as any;
      testStore.setPublishParams(hostPublishParams);
    });

    afterEach(() => {
      mockDenyGetUserMedia.mockClear().mockImplementationOnce(gumError);
      failureCallback.mockClear();
    });

    afterAll(() => {
      failureCallback.mockRestore();
    });

    it('handles the absence of web cam in device', async () => {
      global.navigator.mediaDevices.enumerateDevices = mockEnumerateDevices({
        videoInput: false,
      }) as any; // fail cam permission
      await manager.getTracksToPublish({});

      expect(failureCallback).toHaveBeenCalledTimes(1);

      const onFailureError = failureCallback.mock.calls[0][0];

      expect(onFailureError).toBeDefined();
      expect(onFailureError.message).toContain('video');
      expect(onFailureError.message).not.toContain('audio');

      expect(mockDenyGetUserMedia).toHaveBeenCalledTimes(2);

      const constraints = mockDenyGetUserMedia.mock.calls[1][0];

      expect(constraints).toHaveProperty('video', false);
      expect(constraints).toHaveProperty('audio');
    });

    it('handles the absence of mic permission', async () => {
      global.navigator.mediaDevices.enumerateDevices = mockEnumerateDevices({
        audioInput: false,
      }) as any; // fail mic permission
      await manager.getTracksToPublish({});

      expect(failureCallback).toHaveBeenCalledTimes(1);

      const onFailureError = failureCallback.mock.calls[0][0];

      expect(onFailureError).toBeDefined();
      expect(onFailureError.message).toContain('audio');
      expect(onFailureError.message).not.toContain('video');

      expect(mockDenyGetUserMedia).toHaveBeenCalledTimes(2);

      const constraints = mockDenyGetUserMedia.mock.calls[1][0];

      expect(constraints).toHaveProperty('audio', false);
      expect(constraints).toHaveProperty('video');
    });

    it('handles the absence of both video and audio denials', async () => {
      global.navigator.mediaDevices.enumerateDevices = mockEnumerateDevices({
        videoInput: false,
        audioInput: false,
      }) as any; // fail cam & mic permission
      await manager.getTracksToPublish({});

      expect(failureCallback).toHaveBeenCalledTimes(1);

      const onFailureError = failureCallback.mock.calls[0][0];

      expect(onFailureError).toBeDefined();
      expect(onFailureError.message).toContain('audio');
      expect(onFailureError.message).toContain('video');

      expect(mockDenyGetUserMedia).toHaveBeenCalledTimes(1);
    });
  });
});
