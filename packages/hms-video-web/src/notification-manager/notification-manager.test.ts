import { HMSAudioListener, HMSPeerUpdate, HMSRoomUpdate, HMSUpdateListener } from '../interfaces';
import { HMSNotificationMethod } from './HMSNotificationMethod';
import { HMSPeer, HMSRemotePeer } from '../sdk/models/peer';
import HMSRoom from '../sdk/models/HMSRoom';
import { NotificationManager } from './NotificationManager';
import { Store } from '../sdk/store';
import { fakeMessage, fakePeer, fakePeerList, fakeReconnectPeerList, fakeSpeakerList, FAKE_PEER_ID } from './fixtures';
import { EventBus } from '../events/EventBus';

let joinHandler: jest.Mock<any, any>;
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

let listener: HMSUpdateListener;
let audioListener: HMSAudioListener;
const store: Store = new Store();
let notificationManager: NotificationManager;
let eventBus: EventBus;

beforeEach(() => {
  joinHandler = jest.fn();
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
  eventBus = new EventBus();
  store.setRoom(new HMSRoom('1234', store));

  listener = {
    onJoin: joinHandler,
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
  };

  audioListener = { onAudioLevelUpdate: audioUpdateHandler };

  notificationManager = new NotificationManager(store, eventBus, listener, audioListener);
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
      expect(peerUpdateHandler).toHaveBeenCalledTimes(2);

      expect(peerUpdateHandler.mock.calls[0][0]).toBe(HMSPeerUpdate.PEER_LEFT);
      expect(peerUpdateHandler.mock.calls[0][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[0][1].peerId).toBe('peer_id_3');

      expect(peerUpdateHandler.mock.calls[1][0]).toBe(HMSPeerUpdate.PEER_JOINED);
      expect(peerUpdateHandler.mock.calls[1][1]).toBeInstanceOf(HMSRemotePeer);
      expect(peerUpdateHandler.mock.calls[1][1].peerId).toBe('peer_id_2');

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
      expect(messageReceivedHandler.mock.calls[0][0].sender).toBeInstanceOf(HMSPeer);
      expect(messageReceivedHandler.mock.calls[0][0].sender.peerId).toBe(FAKE_PEER_ID);
    });
  });
});
