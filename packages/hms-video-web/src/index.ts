import HMSConfig from './interfaces/config';
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from './interfaces/hms';
import HMSMessage, { HMSMessageListener } from './interfaces/message';
import HMSPeer from './interfaces/hms-peer';
import HMSTransport from './transport';
import ITransportObserver from './transport/ITransportObserver';
import HMSUpdateListener, { HMSPeerUpdate, HMSTrackUpdate } from './interfaces/update-listener';
import log from 'loglevel';
import Peer from './peer';
import { getRoomId } from './utils';
import { getNotificationMethod, HMSNotificationMethod } from './sdk/models/enums/HMSNotificationMethod';
import { getNotification, HMSNotifications, Peer as PeerNotification } from './sdk/models/HMSNotifications';
import NotificationManager from './sdk/NotificationManager';
import HMSTrack from './media/tracks/HMSTrack';

export default class HMSSdk implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF;
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF;
  transport: HMSTransport;
  roomId!: string;
  localPeer!: HMSPeer;

  private TAG: string = 'HMSSdk';
  private notificationManager: NotificationManager = new NotificationManager();
  private listener!: HMSUpdateListener;

  constructor() {
    this.transport = new HMSTransport(this.observer);
    log.setLevel(log.levels.DEBUG);
  }

  join(config: HMSConfig, listener: HMSUpdateListener) {
    log.debug(config, listener);

    const roomId = getRoomId(config.authToken);

    this.transport.join(
      {
        roomId: roomId,
        token: config.authToken,
      },
      (error, result) => {
        if (error) throw error;

        this.roomId = roomId;
        this.localPeer = new Peer({
          name: config.userName,
          isLocal: true,
        });

        log.debug(result);
      },
    );

    this.listener = listener;
  }

  leave() {
    if (this.roomId) {
      this.transport.leave(this.roomId, (error, result) => {
        if (error) log.error(error);
        else log.debug(result);
      });
    }
  }

  getLocalPeer(): HMSPeer {
    return this.localPeer;
  }

  getPeers(): HMSPeer[] {
    return [...this.notificationManager.hmsPeerList, this.localPeer];
  }

  sendMessage(message: HMSMessage) {
    console.log(message);
    throw 'Yet to implement';
  }

  onMessageReceived(cb: HMSMessageListener) {
    console.log(cb);
    throw 'Yet to implement';
  }

  startScreenShare() {
    throw 'Yet to implement';
  }

  stopScreenShare() {
    throw 'Yet to implement';
  }

  onNotificationHandled = (method: HMSNotificationMethod, notification: HMSNotifications) => {
    let peer, hmsPeer;
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN:
        peer = notification as PeerNotification;
        hmsPeer = this.notificationManager.findPeerByUID(peer.uid);
        hmsPeer
          ? this.listener.onPeerUpdate(HMSPeerUpdate.PEER_JOINED, hmsPeer!)
          : log.error(this.TAG, `peer not found in peer-list ${peer}`);
        break;
      case HMSNotificationMethod.PEER_LEAVE:
        peer = notification as PeerNotification;
        hmsPeer = this.notificationManager.findPeerByUID(peer.uid);
        hmsPeer
          ? this.listener.onPeerUpdate(HMSPeerUpdate.PEER_LEFT, hmsPeer)
          : log.error(this.TAG, `peer not found in peer-list ${peer}`);
        break;
      case HMSNotificationMethod.PEER_LIST:

      case HMSNotificationMethod.STREAM_ADD:

      case HMSNotificationMethod.ACTIVE_SPEAKERS: // TODO: Write code for this
        return;
    }
  };

  private observer: ITransportObserver = {
    onNotification: (message: any) => {
      const method = getNotificationMethod(message!.method);

      // TODO: WRITE CODE FOR THIS
      if (method === HMSNotificationMethod.ACTIVE_SPEAKERS) return;

      const notification = getNotification(method, message!.params);

      this.notificationManager.handleNotification(method, notification);
      this.onNotificationHandled(method, notification);
    },

    onTrackAdd: (track: HMSTrack) => {
      const hmsPeer = this.notificationManager.handleOnTrackAdd(track);
      hmsPeer
        ? this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, hmsPeer)
        : log.error(this.TAG, `No Peer found for added track:: ${track}`);
    },

    onTrackRemove: (track: HMSTrack) => {
      const hmsPeer = this.notificationManager.handleOnTrackRemove(track);
      hmsPeer
        ? this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer)
        : log.error(this.TAG, `No Peer found for added track:: ${track}`);
    },

    onFailure: () => {},
  };
}
