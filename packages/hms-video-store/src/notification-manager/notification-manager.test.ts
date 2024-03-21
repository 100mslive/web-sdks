import { FAKE_PEER_ID, fakeMessage, fakePeer, fakePeerList, fakeReconnectPeerList, fakeSpeakerList } from './fixtures';
import { HMSNotificationMethod } from './HMSNotificationMethod';
import { NotificationManager } from './NotificationManager';
import { AnalyticsEventsService } from '../analytics/AnalyticsEventsService';
import { AnalyticsTimer } from '../analytics/AnalyticsTimer';
import { PluginUsageTracker } from '../common/PluginUsageTracker';
import { DeviceManager } from '../device-manager';
import { EventBus } from '../events/EventBus';
import { HMSAudioListener, HMSPeerUpdate, HMSRoomUpdate, HMSUpdateListener } from '../interfaces';
import HMSRoom from '../sdk/models/HMSRoom';
import { HMSRemotePeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';
import HMSTransport from '../transport';

let joinHandler: jest.Mock<any, any>;
let previewHandler: jest.Mock<any, any>;
let roomUpdateHandler: jest.Mock<any, any>;
let peerUpdateHandler: jest.Mock<any, any>;
let trackUpdateHandler: jest.Mock<any, any>;
let messageReceivedHandler: jest.Mock<any, any>;
let errorHandler: jest.Mock<any, any>;
let reconnectingHandler: jest.Mock<any, any>;
let reconnectedHandler: jest.Mock<any, any>;
let roleChangeRequestHandler: jest.Mock<any, any>;
let roleUpdateHandler: jest.Mock<any, any>;
let changeTrackStateRequestHandler: jest.Mock<any, any>;
let changeMultiTrackStateRequestHandler: jest.Mock<any, any>;
let removedFromRoomHandler: jest.Mock<any, any>;
let audioUpdateHandler: jest.Mock<any, any>;
let sessionStoreUpdateHandler: jest.Mock<any, any>;
let pollsUpdateHandler: jest.Mock<any, any>;
let whiteboardUpdateHandler: jest.Mock<any, any>;

let listener: HMSUpdateListener;
let audioListener: HMSAudioListener;
const store: Store = new Store();
let notificationManager: NotificationManager;
let eventBus: EventBus;
let transport: HMSTransport;

beforeEach(() => {
  joinHandler = jest.fn();
  previewHandler = jest.fn();
  roomUpdateHandler = jest.fn();
  peerUpdateHandler = jest.fn();
  trackUpdateHandler = jest.fn();
  messageReceivedHandler = jest.fn();
  errorHandler = jest.fn();
  reconnectingHandler = jest.fn();
  reconnectedHandler = jest.fn();
  roleChangeRequestHandler = jest.fn();
  roleUpdateHandler = jest.fn();
  changeTrackStateRequestHandler = jest.fn();
  changeMultiTrackStateRequestHandler = jest.fn();
  removedFromRoomHandler = jest.fn();
  audioUpdateHandler = jest.fn();
  sessionStoreUpdateHandler = jest.fn();
  pollsUpdateHandler = jest.fn();
  whiteboardUpdateHandler = jest.fn();
  eventBus = new EventBus();
  const mockMediaStream = {
    id: 'native-stream-id',
    getVideoTracks: jest.fn(() => [
      {
        id: 'video-id',
        kind: 'video',
        getSettings: jest.fn(() => ({ deviceId: 'video-device-id' })),
        addEventListener: jest.fn(() => {}),
      },
    ]),
    getAudioTracks: jest.fn(() => [
      {
        id: 'audio-id',
        kind: 'audio',
        getSettings: jest.fn(() => ({ deviceId: 'audio-device-id' })),
        addEventListener: jest.fn(() => {}),
      },
    ]),
    addTrack: jest.fn(() => {}),
  };
  global.MediaStream = jest.fn().mockImplementation(() => mockMediaStream);
  // @ts-ignore
  global.HTMLCanvasElement.prototype.captureStream = jest.fn().mockImplementation(() => mockMediaStream);

  transport = new HMSTransport(
    {
      onNotification: jest.fn(),
      onTrackAdd: jest.fn(),
      onTrackRemove: jest.fn(),
      onFailure: jest.fn(),
      onStateChange: jest.fn(),
      onConnected: jest.fn(),
    },
    new DeviceManager(store, eventBus),
    store,
    eventBus,
    new AnalyticsEventsService(store),
    new AnalyticsTimer(),
    new PluginUsageTracker(eventBus),
  );
  store.setRoom(new HMSRoom('1234'));

  listener = {
    onJoin: joinHandler,
    onPreview: previewHandler,
    onRoomUpdate: roomUpdateHandler,
    onPeerUpdate: peerUpdateHandler,
    onTrackUpdate: trackUpdateHandler,
    onMessageReceived: messageReceivedHandler,
    onError: errorHandler,
    onReconnecting: reconnectingHandler,
    onReconnected: reconnectedHandler,
    onRoleChangeRequest: roleChangeRequestHandler,
    onRoleUpdate: roleUpdateHandler,
    onChangeTrackStateRequest: changeTrackStateRequestHandler,
    onChangeMultiTrackStateRequest: changeMultiTrackStateRequestHandler,
    onRemovedFromRoom: removedFromRoomHandler,
    onSessionStoreUpdate: sessionStoreUpdateHandler,
    onPollsUpdate: pollsUpdateHandler,
    onWhiteboardUpdate: whiteboardUpdateHandler,
  };

  audioListener = { onAudioLevelUpdate: audioUpdateHandler };

  notificationManager = new NotificationManager(store, eventBus, transport, listener, audioListener);
});

describe('Notification Manager', () => {
  describe('on-peer-join', () => {
    it('should call onPeerUpdate with correct parameters', () => {
      notificationManager.handleNotification({ method: HMSNotificationMethod.PEER_JOIN, params: fakePeer });

      // console.log({ peer: peerUpdateHandler.mock.calls[0][1] });
      expect(peerUpdateHandler).toHaveBeenCalled();
      expect(peerUpdateHandler.mock.calls[0][0]).toBe(HMSPeerUpdate.PEER_JOINED);
      expect(peerUpdateHandler.mock.calls[0][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[0][1].peerId).toBe(fakePeer.peer_id);
    });

    it('should add peer in store', () => {
      notificationManager.handleNotification({ method: HMSNotificationMethod.PEER_JOIN, params: fakePeer });
      const peer = store.getPeerById(fakePeer.peer_id);
      expect(peer).toBeInstanceOf(HMSRemotePeer);
      expect(peer?.peerId).toBe(fakePeer.peer_id);
    });
  });

  describe('on-peer-leave', () => {
    it('should call onPeerUpdate with correct parameters', () => {
      notificationManager.handleNotification({ method: HMSNotificationMethod.PEER_LEAVE, params: fakePeer });

      expect(peerUpdateHandler).toHaveBeenCalled();
      expect(peerUpdateHandler.mock.calls[0][0]).toBe(HMSPeerUpdate.PEER_LEFT);
      expect(peerUpdateHandler.mock.calls[0][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[0][1].peerId).toBe(fakePeer.peer_id);
    });

    it('should remove peer from store', () => {
      const peer = store.getPeerById(fakePeer.peer_id);
      expect(peer).toBeUndefined();
    });
  });

  describe('initial peer-list', () => {
    it('should call onPeerUpdate with correct parameters', () => {
      notificationManager.handleNotification({ method: HMSNotificationMethod.PEER_LIST, params: fakePeerList });

      expect(peerUpdateHandler).toHaveBeenCalled();
      peerUpdateHandler.mock.calls.forEach(call => {
        expect(call[0]).toBe(HMSPeerUpdate.PEER_LIST);
        expect(call[1][0]).toBeInstanceOf(HMSRemotePeer);
      });
      expect(roomUpdateHandler).toHaveBeenCalled();
      expect(roomUpdateHandler.mock.calls[0][0]).toBe(HMSRoomUpdate.RECORDING_STATE_UPDATED);
    });
  });

  describe('reconnect peer-list', () => {
    it('should call onPeerUpdate with correct parameters', () => {
      notificationManager.handleNotification(
        { method: HMSNotificationMethod.PEER_LIST, params: fakeReconnectPeerList },
        true,
      );

      // console.log({ reconnectPeerListMock: peerUpdateHandler.mock.calls });
      expect(peerUpdateHandler).toHaveBeenCalledTimes(3);

      expect(peerUpdateHandler.mock.calls[0][0]).toBe(HMSPeerUpdate.PEER_LEFT);
      expect(peerUpdateHandler.mock.calls[0][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[0][1].peerId).toBe('peer_id_3');

      expect(peerUpdateHandler.mock.calls[1][0]).toBe(HMSPeerUpdate.PEER_REMOVED);
      expect(peerUpdateHandler.mock.calls[1][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[1][1].peerId).toBe('peer_id_1');

      expect(peerUpdateHandler.mock.calls[2][0]).toBe(HMSPeerUpdate.PEER_LIST);
      expect(peerUpdateHandler.mock.calls[2][1][0]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[2][1][0].peerId).toBe('peer_id_1');

      expect(roomUpdateHandler).toHaveBeenCalled();
      expect(roomUpdateHandler.mock.calls[0][0]).toBe(HMSRoomUpdate.RECORDING_STATE_UPDATED);
    });
  });

  describe('active-speakers', () => {
    it('should call active speaker callbacks with correct parameters', () => {
      notificationManager.handleNotification({
        method: HMSNotificationMethod.ACTIVE_SPEAKERS,
        params: fakeSpeakerList,
      });
      expect(audioUpdateHandler).toBeCalled();
      expect(audioUpdateHandler.mock.calls[0][0][0].peer.peerId).toBe(FAKE_PEER_ID);
      expect(peerUpdateHandler).toBeCalled();
      expect(peerUpdateHandler.mock.calls[0][0]).toBe(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER);
      expect(peerUpdateHandler.mock.calls[0][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[0][1].peerId).toBe(FAKE_PEER_ID);
    });
  });

  describe('broadcast', () => {
    it('should call onMessageReceived with correct parameters', () => {
      notificationManager.handleNotification({ method: HMSNotificationMethod.BROADCAST, params: fakeMessage });

      expect(messageReceivedHandler).toBeCalled();
      expect(messageReceivedHandler.mock.calls[0][0].peer.peer_id).toBe(FAKE_PEER_ID);
    });
  });
});
