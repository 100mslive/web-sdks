import {
  createDefaultStoreState,
  HMSException,
  HMSNotificationSeverity,
  HMSNotificationTypes,
  HMSPeer,
  HMSStore,
  HMSTrack,
} from '../../';
import * as sdkTypes from '../../internal';
import { PEER_NOTIFICATION_TYPES, TRACK_NOTIFICATION_TYPES } from '../../reactive-store/common/mapping';
import { HMSNotifications } from '../../reactive-store/HMSNotifications';
import { HMSReactiveStore } from '../../reactive-store/HMSReactiveStore';
import { makeFakeStore } from '../fakeStore';
import { makeFakePeer, makeFakeTrack } from '../fixtures';

let notifications: HMSNotifications;
let peer: HMSPeer;
let track: HMSTrack;
let fakeStore: HMSStore;
let cb: jest.Mock;
let unsub: () => void;
beforeEach(() => {
  const store = HMSReactiveStore.createNewHMSStore('HMSStore', createDefaultStoreState);
  notifications = new HMSNotifications(store);
  cb = jest.fn(val => val);
  unsub = notifications.onNotification(cb);
  peer = makeFakePeer();
  track = makeFakeTrack();
  fakeStore = makeFakeStore();
});

function makeException(name: string): HMSException {
  return {
    name: name,
  } as HMSException;
}

describe('hms notifications tests', () => {
  test('when unhandled peer event on Notification not to be called', () => {
    notifications.sendPeerUpdate(sdkTypes.HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, peer);
    expect(cb.mock.calls.length).toBe(0);
  });

  test('when peer joined on Notification to be called', () => {
    notifications.sendPeerUpdate(sdkTypes.HMSPeerUpdate.PEER_JOINED, peer);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.type).toBe(PEER_NOTIFICATION_TYPES[sdkTypes.HMSPeerUpdate.PEER_JOINED]);
    expect(cb.mock.results[0].value.data).toBe(peer);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.INFO);
  });

  test('when peer left on Notification to be called', () => {
    notifications.sendPeerUpdate(sdkTypes.HMSPeerUpdate.PEER_LEFT, peer);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.type).toBe(PEER_NOTIFICATION_TYPES[sdkTypes.HMSPeerUpdate.PEER_LEFT]);
    expect(cb.mock.results[0].value.data).toBe(peer);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.INFO);
  });

  test('when track added on Notification to be called', () => {
    notifications.sendTrackUpdate(sdkTypes.HMSTrackUpdate.TRACK_ADDED, track.id);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.type).toBe(TRACK_NOTIFICATION_TYPES[sdkTypes.HMSTrackUpdate.TRACK_ADDED]);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.INFO);
  });

  test('when track removed on Notification to be called', () => {
    notifications.sendTrackUpdate(sdkTypes.HMSTrackUpdate.TRACK_REMOVED, track.id);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.type).toBe(TRACK_NOTIFICATION_TYPES[sdkTypes.HMSTrackUpdate.TRACK_REMOVED]);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.INFO);
  });

  test('when new message received on Notification to be called', () => {
    const message = fakeStore.messages.byID['201'];
    notifications.sendMessageReceived(message);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.data).toBe(message);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.INFO);
  });

  test('when error received on Notification to be called', () => {
    const error = makeException('Test');
    notifications.sendError(error);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.data).toBe(error);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.ERROR);
  });

  test('when reconnected received on Notification to be called', () => {
    notifications.sendReconnected();
    expect(cb.mock.calls.length).toBe(1);
  });

  test('when reconnecting received on Notification to be called', () => {
    const error = makeException('Test');
    notifications.sendReconnecting(error);
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.results[0].value.data).toBe(error);
    expect(cb.mock.results[0].value.severity).toBe(HMSNotificationSeverity.ERROR);
  });

  test('when unsubscribed on Notification not to be called', () => {
    unsub();
    notifications.sendReconnected();
    expect(cb.mock.calls.length).toBe(0);
  });

  test('when type is passed and does not match, callback not to be called', () => {
    const callback = jest.fn(val => val);
    notifications.onNotification(callback, HMSNotificationTypes.ERROR);
    notifications.sendReconnected();
    expect(callback.mock.calls.length).toBe(0);
  });

  test('when type is passed and matches, callback to be called, ', () => {
    const callback = jest.fn(val => val);
    notifications.onNotification(callback, HMSNotificationTypes.RECONNECTED);
    notifications.sendReconnected();
    expect(callback.mock.calls.length).toBe(1);
  });

  test('when types are passed and does not match, callback not to be called', () => {
    const callback = jest.fn(val => val);
    notifications.onNotification(callback, [HMSNotificationTypes.ERROR, HMSNotificationTypes.PEER_JOINED]);
    notifications.sendReconnected();
    expect(callback.mock.calls.length).toBe(0);
  });

  test('when types are passed and matches, callback to be called', () => {
    const callback = jest.fn(val => val);
    const error = makeException('Test');
    notifications.onNotification(callback, [HMSNotificationTypes.RECONNECTED, HMSNotificationTypes.RECONNECTING]);
    notifications.sendReconnecting(error);
    notifications.sendReconnected();
    expect(callback.mock.calls.length).toBe(2);
  });
});
