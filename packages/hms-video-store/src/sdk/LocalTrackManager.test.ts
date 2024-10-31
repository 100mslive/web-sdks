import { HMSLocalPeer } from './models/peer';
import { LocalTrackManager } from './LocalTrackManager';
import { Store } from './store';
import { AnalyticsTimer } from '../analytics/AnalyticsTimer';
import { DeviceManager } from '../device-manager';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import { HMSLocalVideoTrack, HMSPeerType, HMSTrackType } from '../internal';
import { HMSLocalStream } from '../media/streams/HMSLocalStream';
import { HMSTrack } from '../media/tracks';
import { PolicyParams } from '../notification-manager';
import ITransportObserver from '../transport/ITransportObserver';
import { TransportState } from '../transport/models/TransportState';

const testObserver: ITransportObserver = {
  onNotification(_: any): void {},

  onTrackAdd(_: HMSTrack): void {},

  onTrackRemove(_: HMSTrack): void {},

  onFailure(_: HMSException): void {
    // console.log('sdk Failure Callback', _s);
  },

  onConnected(): void {},

  async onStateChange(_: TransportState, __?: HMSException): Promise<void> {},
};

let testStore = new Store();
let testEventBus = new EventBus();
let analyticsTimer = new AnalyticsTimer();

const policyParams: PolicyParams = {
  name: 'host',
  template_id: '1',
  known_roles: {
    host: {
      name: 'host',
      subscribeParams: {
        maxSubsBitRate: 1000,
        subscribeToRoles: ['host'],
      },
      priority: 1,
      permissions: {
        endRoom: false,
        removeOthers: false,
        unmute: false,
        mute: false,
        changeRole: false,
        hlsStreaming: false,
        rtmpStreaming: false,
        browserRecording: false,
        pollRead: false,
        pollWrite: false,
      },
      publishParams: {
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
        simulcast: {
          video: {
            layers: [],
          },
          screen: {
            layers: [],
          },
        },
      },
    },
  },
  plugins: {
    whiteboard: {},
  },
};

const hostRole = policyParams.known_roles[policyParams.name];
const publishParams = hostRole.publishParams;

let localPeer = new HMSLocalPeer({
  name: 'test',
  role: hostRole,
  type: HMSPeerType.REGULAR,
});
testStore.addPeer(localPeer);

const mockMediaStream = {
  id: 'native-stream-id',
  getVideoTracks: jest.fn(() => [
    {
      id: 'video-id',
      kind: 'video',
      getSettings: jest.fn(() => ({ deviceId: 'video-device-id' })),
      addEventListener: jest.fn(() => {}),
      removeEventListener: jest.fn(() => {}),
    },
  ]),
  getAudioTracks: jest.fn(() => [
    {
      id: 'audio-id',
      kind: 'audio',
      getSettings: jest.fn(() => ({ deviceId: 'audio-device-id' })),
      addEventListener: jest.fn(() => {}),
      removeEventListener: jest.fn(() => {}),
    },
  ]),
  addTrack: jest.fn(() => {}),
};

const gumSuccess = (constraints: any) => {
  const mediaStream = { ...mockMediaStream };
  if (!constraints.video) {
    mediaStream.getVideoTracks = jest.fn(() => []);
  }

  if (!constraints.audio) {
    mediaStream.getAudioTracks = jest.fn(() => []);
  }

  return Promise.resolve(mediaStream);
};

const gumError = (_: never) => Promise.reject(new Error('Permission denied'));

class OverconstrainedError extends Error {
  constraint = '';
  constructor(constraint: string, message: string) {
    super(message);
    this.name = 'OverconstrainedError';
    this.constraint = constraint;
  }
}

const mockOverConstrainedError = new OverconstrainedError('deviceId', '');
const gumOverConstrainedError = (_: any) => Promise.reject(mockOverConstrainedError);

const mockGetUserMedia = jest.fn(gumSuccess).mockName('GUM Success');

const mockDenyGetUserMedia = jest
  .fn()
  .mockImplementationOnce(gumError)
  .mockImplementation(gumSuccess)
  .mockName('Deny GUM');

const mockOverConstrainedGetUserMedia = jest
  .fn()
  .mockImplementationOnce(gumOverConstrainedError)
  .mockImplementation(gumSuccess)
  .mockName('Overconstrained GUM');

const mockDevices = [
  { kind: 'audioinput', deviceId: 'audio-device-id', label: 'audioInputLabel' },
  { kind: 'videoinput', deviceId: 'video-device-id', label: 'videoInputLabel' },
  { kind: 'audiooutput', deviceId: 'audio-output-device-id', label: 'audioOutputLabel' },
];

const mockEnumerateDevices = ({ videoInput = true, audioInput = true } = {}) =>
  jest.fn(() =>
    Promise.resolve(
      mockDevices.map(device => ({
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
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// @ts-ignore
global.navigator.mediaDevices = mockMediaDevices;
global.MediaStream = jest.fn().mockImplementation(() => mockMediaStream);
global.performance.mark = require('perf_hooks').performance.mark;
global.performance.measure = require('perf_hooks').performance.measure;

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
        getAudioTracks: jest.fn(() => [
          {
            id: 'audio-id',
            kind: 'audio',
            getSettings: jest.fn(() => ({ deviceId: 'audio-mock-device-id' })),
            addEventListener: jest.fn(() => {}),
            removeEventListener: jest.fn(() => {}),
          },
        ]),
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

  beforeEach(() => {
    testStore = new Store();
    testEventBus = new EventBus();
    localPeer = new HMSLocalPeer({
      name: 'test',
      role: hostRole,
      type: HMSPeerType.REGULAR,
    });
    testStore.addPeer(localPeer);
    analyticsTimer = new AnalyticsTimer();
  });

  it('instantiates without any issues', () => {
    const manager = new LocalTrackManager(
      testStore,
      testObserver,
      new DeviceManager(testStore, testEventBus),
      testEventBus,
      analyticsTimer,
    );
    expect(manager).toBeDefined();
  });

  it('passes the right constraints based on publish params', async () => {
    const manager = new LocalTrackManager(
      testStore,
      testObserver,
      new DeviceManager(testStore, testEventBus),
      testEventBus,
      analyticsTimer,
    );
    testStore.setKnownRoles(policyParams);
    await manager.getTracksToPublish({});

    const constraints = mockGetUserMedia.mock.calls[0][0];

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
    expect(constraints).toHaveProperty('audio');
    expect(constraints).toHaveProperty('video');
  });

  describe('handling permission failures', () => {
    const failureCallback = jest.spyOn(testObserver, 'onFailure');
    let manager: LocalTrackManager;

    beforeEach(() => {
      manager = new LocalTrackManager(
        testStore,
        testObserver,
        new DeviceManager(testStore, testEventBus),
        testEventBus,
        analyticsTimer,
      );
      global.navigator.mediaDevices.getUserMedia = mockDenyGetUserMedia as any;
      testStore.setKnownRoles(policyParams);
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

    // eslint-disable-next-line complexity
    it('handles overconstrained error', async () => {
      global.navigator.mediaDevices.enumerateDevices = mockEnumerateDevices({
        videoInput: true,
        audioInput: true,
      }) as any;
      global.navigator.mediaDevices.getUserMedia = mockOverConstrainedGetUserMedia as any;

      await manager.getTracksToPublish({});

      // console.log(failureCallback.mock);

      expect(failureCallback).toHaveBeenCalledTimes(1);

      const onFailureError = failureCallback.mock.calls[0][0];

      expect(onFailureError).toBeDefined();
      expect(onFailureError.nativeError).toBe(mockOverConstrainedError);

      expect(mockOverConstrainedGetUserMedia).toHaveBeenCalledTimes(2); // One for overconstrained failure, one gum success

      const { audio: audioContraints, video: videoConstraints } = mockOverConstrainedGetUserMedia.mock.calls[0][0];
      const droppedConstraints = mockOverConstrainedGetUserMedia.mock.calls[1][0];

      for (const constraint in audioContraints) {
        if (constraint in publishParams.audio) {
          expect(audioContraints[constraint]).toEqual((publishParams.audio as any)[constraint]);
        }
      }
      for (const constraint in videoConstraints) {
        if (constraint in publishParams.video) {
          const constraintValue = videoConstraints[constraint];
          const value = typeof constraintValue === 'object' ? constraintValue?.ideal : constraintValue;
          expect(value).toEqual((publishParams.video as any)[constraint]);
        }
      }
      for (const constraint in droppedConstraints.audio) {
        expect(droppedConstraints[constraint]).toBeUndefined();
      }
      for (const constraint in droppedConstraints.video) {
        expect(droppedConstraints[constraint]).toBeUndefined();
      }
    });
  });

  describe('getTracksToPublish', () => {
    beforeAll(() => {
      global.navigator.mediaDevices.enumerateDevices = mockEnumerateDevices() as any;
      global.navigator.mediaDevices.getUserMedia = mockGetUserMedia as any;
    });

    beforeEach(() => {
      testStore = new Store();
      testEventBus = new EventBus();
      localPeer = new HMSLocalPeer({
        name: 'test',
        role: hostRole,
        type: HMSPeerType.REGULAR,
      });
      testStore.addPeer(localPeer);
      mockGetUserMedia.mockClear();
    });

    it('diffs the local tracks to publish', async () => {
      const mockVideoTrack = new HMSLocalVideoTrack(
        new HMSLocalStream(mockMediaStream as unknown as MediaStream),
        {
          id: 'video-track-id',
          kind: 'video',
          getSettings: () => ({ deviceId: 'video-device-id', groupId: 'video-group-id' }),
          addEventListener: jest.fn(() => {}),
          removeEventListener: jest.fn(() => {}),
        } as unknown as MediaStreamTrack,
        HMSPeerType.REGULAR,
        testEventBus,
      );
      localPeer.videoTrack = mockVideoTrack;

      testStore.addTrack(mockVideoTrack);

      const manager = new LocalTrackManager(
        testStore,
        testObserver,
        new DeviceManager(testStore, testEventBus),
        testEventBus,
        analyticsTimer,
      );
      testStore.setKnownRoles(policyParams);
      const tracksToPublish = await manager.getTracksToPublish({});

      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      const constraints = mockGetUserMedia.mock.calls[0][0];
      expect(constraints).toHaveProperty('video', false);
      expect(tracksToPublish).toHaveLength(1);
      expect(tracksToPublish[0]).toHaveProperty('type', HMSTrackType.AUDIO);
    });

    it("doesn't fetch tracks if already present", async () => {
      localPeer.videoTrack = new HMSLocalVideoTrack(
        new HMSLocalStream(mockMediaStream as unknown as MediaStream),
        {
          id: 'video-track-id',
          kind: 'video',
          getSettings: () => ({ deviceId: 'video-device-id', groupId: 'video-group-id' }),
          addEventListener: jest.fn(() => {}),
          removeEventListener: jest.fn(() => {}),
        } as unknown as MediaStreamTrack,
        HMSPeerType.REGULAR,
        testEventBus,
      );

      const manager = new LocalTrackManager(
        testStore,
        testObserver,
        new DeviceManager(testStore, testEventBus),
        testEventBus,
        analyticsTimer,
      );
      testStore.setKnownRoles(policyParams);
      const tracksToPublish = await manager.getTracksToPublish({});

      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      const constraints = mockGetUserMedia.mock.calls[0][0];
      expect(constraints.video).toBe(false);
      expect(constraints.audio).not.toBe(false);
      expect(tracksToPublish).toHaveLength(2);
    });
  });
});
