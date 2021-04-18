import HMSConfig from './interfaces/config';
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from './interfaces/hms';
import HMSMessage, { HMSMessageListener } from './interfaces/message';
import HMSPeer from './interfaces/hms-peer';
import HMSTransport from './transport';
import ITransportObserver from './transport/ITransportObserver';
import HMSUpdateListener, { HMSPeerUpdate, HMSTrackUpdate } from './interfaces/update-listener';
import log from 'loglevel';
import { getRoomId } from './utils/room';
import { getNotificationMethod, HMSNotificationMethod } from './sdk/models/enums/HMSNotificationMethod';
import { getNotification, HMSNotifications, Peer as PeerNotification } from './sdk/models/HMSNotifications';
import NotificationManager from './sdk/NotificationManager';
import HMSTrack from './media/tracks/HMSTrack';
import { HMSTrackType } from './media/tracks/HMSTrackType';
import HMSException from './error/HMSException';
import { HMSTrackSettingsBuilder } from './media/settings/HMSTrackSettings';
// import { HMSTrackType } from './media/tracks/HMSTrackType';
import HMSRoom from './sdk/models/HMSRoom';
import { v4 as uuidv4 } from 'uuid';
import Peer from './peer';
import { HMSVideoTrackSettingsBuilder } from './media/settings/HMSVideoTrackSettings';

export default class HMSSdk implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF;
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF;
  transport: HMSTransport;
  roomId!: string | null;
  localPeer!: HMSPeer;

  private TAG: string = 'HMSSdk';
  private notificationManager: NotificationManager = new NotificationManager();
  private listener!: HMSUpdateListener;
  private hmsRoom?: HMSRoom;

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

    onFailure: (exception: HMSException) => {
      this.listener.onError(exception);
    },
  };

  constructor() {
    this.transport = new HMSTransport(this.observer);
    log.setLevel(log.levels.DEBUG);
  }

  join(config: HMSConfig, listener: HMSUpdateListener) {
    this.listener = listener;

    const roomId = getRoomId(config.authToken);
    const peerId = uuidv4();

    this.localPeer = new Peer({ peerId, name: config.userName, isLocal: true, customerDescription: config.metaData });

    this.transport.join(config.authToken, roomId, peerId, { userName: config.userName }).then(() => {
      console.log('JOINED!', roomId);
      this.roomId = roomId;
    });
  }

  leave() {
    if (this.roomId) {
      this.localPeer.audioTrack?.nativeTrack.stop();
      this.localPeer.videoTrack?.nativeTrack.stop();
      this.transport.leave();
      this.roomId = null;
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

  async startScreenShare() {
    if ((this.localPeer.auxiliaryTracks?.length || 0) > 0) {
      throw Error('Cannot share multiple screens');
    }

    const track = await this.transport.getLocalScreen(new HMSVideoTrackSettingsBuilder().build(), () =>
      this.stopScreenShare(),
    );
    await this.transport.publish([track]);
    this.localPeer.auxiliaryTracks = [track];
  }

  async stopScreenShare() {
    // TODO: Right now we assume for now that there is only one aux track -- screen-share
    this.transport.unpublish(this.localPeer.auxiliaryTracks!);
    this.localPeer.auxiliaryTracks!.length = 0;
  }

  onNotificationHandled(method: HMSNotificationMethod, notification: HMSNotifications) {
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
        // TODO: Move getLocalTracks to immediate after `transportLayer.join`
        this.transport.getLocalTracks(new HMSTrackSettingsBuilder().build()).then((hmsTracks) => {
          hmsTracks.forEach((hmsTrack) => {
            switch (hmsTrack.type) {
              case HMSTrackType.AUDIO:
                this.localPeer.audioTrack = hmsTrack;
                break;
              case HMSTrackType.VIDEO:
                this.localPeer.videoTrack = hmsTrack;
            }
          });

          this.listener.onJoin(this.createRoom());
          this.transport.publish(hmsTracks);
        });
        break;
      case HMSNotificationMethod.STREAM_ADD: // TODO: Write code for this
        return;
      case HMSNotificationMethod.ACTIVE_SPEAKERS: // TODO: Write code for this
        return;
    }
  }

  createRoom() {
    const hmsPeerList = this.getPeers();
    this.hmsRoom = new HMSRoom(this.localPeer.peerId, '', hmsPeerList);
    return this.hmsRoom;
  }
}
