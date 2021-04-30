import HMSConfig from '../interfaces/config';
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from '../interfaces/hms';
import HMSPeer from '../interfaces/hms-peer';
import HMSTransport from '../transport';
import ITransportObserver from '../transport/ITransportObserver';
import HMSUpdateListener, { HMSPeerUpdate, HMSTrackUpdate } from '../interfaces/update-listener';
import HMSLogger from '../utils/logger';
import { getRoomId } from '../utils/room';
import { getNotificationMethod, HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import { getNotification, HMSNotifications, Peer as PeerNotification } from './models/HMSNotifications';
import NotificationManager from './NotificationManager';
import HMSTrack from '../media/tracks/HMSTrack';
import { HMSTrackType } from '../media/tracks/HMSTrackType';
import HMSException from '../error/HMSException';
import { HMSTrackSettingsBuilder } from '../media/settings/HMSTrackSettings';
import HMSRoom from './models/HMSRoom';
import { v4 as uuidv4 } from 'uuid';
import Peer from '../peer';
import { DefaultVideoSettings } from '../media/settings';
import Message from './models/HMSMessage';

export class HMSSdk implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF;
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF;
  transport!: HMSTransport;
  roomId!: string | null;
  localPeer!: HMSPeer;

  private TAG: string = '[HMSSdk]:';
  private notificationManager: NotificationManager = new NotificationManager();
  private listener!: HMSUpdateListener;
  private hmsRoom?: HMSRoom;
  private published: boolean = false;

  private observer: ITransportObserver = {
    onNotification: (message: any) => {
      const method = getNotificationMethod(message.method);
      const notification = getNotification(method, message.params);
      this.notificationManager.handleNotification(method, notification, this.listener);
      this.onNotificationHandled(method, notification);
    },

    onTrackAdd: (track: HMSTrack) => {
      this.notificationManager.handleOnTrackAdd(track);
    },

    onTrackRemove: (track: HMSTrack) => {
      this.notificationManager.handleOnTrackRemove(track);
    },

    onFailure: (exception: HMSException) => {
      this.listener.onError(exception);
    },
  };

  constructor() {
    this.transport = new HMSTransport(this.observer);
  }

  join(config: HMSConfig, listener: HMSUpdateListener) {
    this.transport = new HMSTransport(this.observer);
    this.listener = listener;

    const roomId = getRoomId(config.authToken);

    const peerId = uuidv4();

    this.localPeer = new Peer({ peerId, name: config.userName, isLocal: true, customerDescription: config.metaData });

    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    this.transport.join(config.authToken, this.localPeer.peerId, { name: config.userName }).then(() => {
      HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
      this.roomId = roomId;
      if (!this.published) {
        this.publish();
      }
    });
  }

  async leave() {
    if (this.roomId) {
      HMSLogger.d(this.TAG, `⏳ Leaving room ${this.roomId}`);
      this.localPeer.audioTrack?.nativeTrack.stop();
      this.localPeer.videoTrack?.nativeTrack.stop();
      this.notificationManager.handleLeave();
      this.transport.leave();
      HMSLogger.d(this.TAG, `✅ Left room ${this.roomId}`);
      this.roomId = null;
    }
  }

  getLocalPeer(): HMSPeer {
    return this.localPeer;
  }

  getPeers(): HMSPeer[] {
    const remotePeers = Array.from(this.notificationManager.hmsPeerList, (x) => x[1]);
    const peers = this.localPeer ? [...remotePeers, this.getLocalPeer()] : remotePeers;
    HMSLogger.d(this.TAG, `Got peers`, peers);
    return peers;
  }

  sendMessage(type: string, message: string, receiver?: string) {
    const hmsMessage = new Message({ sender: this.localPeer.peerId, type, message, receiver });
    HMSLogger.d(this.TAG, 'Sending Message:: ', hmsMessage);
    this.transport.sendMessage(hmsMessage);
    return hmsMessage;
  }

  async startScreenShare(onStop: () => void) {
    // TODO: add optional arguments `settings`

    if ((this.localPeer.auxiliaryTracks?.length || 0) > 0) {
      throw Error('Cannot share multiple screens');
    }

    const track = await this.transport.getLocalScreen(DefaultVideoSettings.HD);
    track.nativeTrack.onended = () => {
      this.stopEndedScreenshare(onStop);
    };
    await this.transport.publish([track]);
    this.localPeer.auxiliaryTracks.push(track);
  }

  private async stopEndedScreenshare(onStop: () => void) {
    HMSLogger.d(this.TAG, `✅ Screenshare ended natively`);
    await this.stopScreenShare();
    onStop();
  }

  async stopScreenShare() {
    HMSLogger.d(this.TAG, `✅ Screenshare ended from app`);
    const track = this.localPeer.auxiliaryTracks.find((t) => t.type === HMSTrackType.VIDEO && t.source === 'screen');
    if (track) {
      await track.setEnabled(false);
      this.transport.unpublish([track]);
      this.localPeer.auxiliaryTracks.splice(this.localPeer.auxiliaryTracks.indexOf(track), 1);
    }
  }

  onNotificationHandled(method: HMSNotificationMethod, notification: HMSNotifications) {
    HMSLogger.d(this.TAG, 'onNotificationHandled', method);
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN: {
        const peer = notification as PeerNotification;
        const hmsPeer = this.notificationManager.findPeerByUID(peer.peerId);
        hmsPeer
          ? this.listener.onPeerUpdate(HMSPeerUpdate.PEER_JOINED, hmsPeer)
          : HMSLogger.e(this.TAG, `⚠️ peer not found in peer-list`, peer, this.notificationManager.hmsPeerList);
        break;
      }

      case HMSNotificationMethod.PEER_LEAVE: {
        const peer = notification as PeerNotification;
        const hmsPeer = new Peer({
          peerId: peer.peerId,
          name: peer.info.name,
          isLocal: false,
          customerDescription: peer.info.data,
        }); //@TODO: There should be a cleaner way

        if (hmsPeer.audioTrack) {
          this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.audioTrack, hmsPeer);
        }

        if (hmsPeer.videoTrack) {
          this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.videoTrack, hmsPeer);
        }

        hmsPeer.auxiliaryTracks?.forEach((track) => {
          this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
        });

        this.listener.onPeerUpdate(HMSPeerUpdate.PEER_LEFT, hmsPeer);
        break;
      }

      case HMSNotificationMethod.PEER_LIST:
        this.listener.onJoin(this.createRoom());
        break;

      case HMSNotificationMethod.ROLE_CHANGE:
        if (this.roomId) {
          this.publish();
        }
        break;

      case HMSNotificationMethod.ACTIVE_SPEAKERS:
        return;

      case HMSNotificationMethod.BROADCAST:
        const message = notification as Message;
        HMSLogger.d(this.TAG, `Received Message:: `, message);
        this.listener.onMessageReceived(message);
    }
  }

  private publish() {
    this.transport.getLocalTracks(new HMSTrackSettingsBuilder().build()).then(async (hmsTracks) => {
      hmsTracks.forEach((hmsTrack) => {
        switch (hmsTrack.type) {
          case HMSTrackType.AUDIO:
            this.localPeer.audioTrack = hmsTrack;
            break;

          case HMSTrackType.VIDEO:
            this.localPeer.videoTrack = hmsTrack;
        }
        this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsTrack, this.localPeer);
      });
      await this.transport.publish(hmsTracks);
      this.published = true;
    });
  }

  createRoom() {
    const hmsPeerList = this.getPeers();
    this.hmsRoom = new HMSRoom(this.localPeer.peerId, '', hmsPeerList);
    return this.hmsRoom;
  }
}
