import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSAudioListener, HMSUpdateListener } from '../interfaces';
import { HMSRemoteTrack } from '../media/tracks';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';
import { HMSNotificationMethod } from './HMSNotificationMethod';
import { PolicyParams, SpeakerList, TrackStateNotification } from './HMSNotifications';
import { ActiveSpeakerManager } from './managers/ActiveSpeakerManager';
import { BroadcastManager } from './managers/BroadcastManager';
import { PeerListManager } from './managers/PeerListManager';
import { PeerManager } from './managers/PeerManager';
import { PolicyChangeManager } from './managers/PolicyChangeManager';
import { RequestManager } from './managers/RequestManager';
import { RoomUpdateManager } from './managers/RoomUpdateManager';
import { TrackManager } from './managers/TrackManager';

export class NotificationManager {
  private TAG = '[HMSNotificationManager]';
  private trackManager: TrackManager;
  private peerManager: PeerManager;
  private peerListManager: PeerListManager;
  private activeSpeakerManager: ActiveSpeakerManager;
  private broadcastManager: BroadcastManager;
  private policyChangeManager: PolicyChangeManager;
  private requestManager: RequestManager;
  private roomUpdateManager: RoomUpdateManager;
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor(private store: IStore, private listener?: HMSUpdateListener, private audioListener?: HMSAudioListener) {
    this.trackManager = new TrackManager(this.store, this.eventEmitter, this.listener);
    this.peerManager = new PeerManager(this.store, this.trackManager, this.listener);
    this.peerListManager = new PeerListManager(this.store, this.peerManager, this.trackManager, this.listener);
    this.broadcastManager = new BroadcastManager(this.store, this.listener);
    this.policyChangeManager = new PolicyChangeManager(this.store, this.eventEmitter);
    this.requestManager = new RequestManager(this.store, this.listener);
    this.activeSpeakerManager = new ActiveSpeakerManager(this.store, this.listener, this.audioListener);
    this.roomUpdateManager = new RoomUpdateManager(this.store, this.listener);
  }

  setListener(listener?: HMSUpdateListener) {
    this.listener = listener;
    this.trackManager.listener = listener;
    this.peerManager.listener = listener;
    this.peerListManager.listener = listener;
    this.broadcastManager.listener = listener;
    this.requestManager.listener = listener;
    this.activeSpeakerManager.listener = listener;
    this.roomUpdateManager.listener = listener;
  }

  setAudioListener(audioListener?: HMSAudioListener) {
    this.audioListener = audioListener;
    this.activeSpeakerManager.audioListener = audioListener;
  }

  addEventListener(event: string, listener: EventListener) {
    this.eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: string, listener: EventListener) {
    this.eventEmitter.removeListener(event, listener);
  }

  once(event: string, listener: EventListener) {
    this.eventEmitter.once(event, listener);
  }

  handleNotification(message: { method: string; params: any }, isReconnecting = false) {
    const method = message.method as HMSNotificationMethod;
    const notification = message.params;

    if (![HMSNotificationMethod.ACTIVE_SPEAKERS, HMSNotificationMethod.SFU_STATS].includes(method)) {
      HMSLogger.d(this.TAG, 'Received notification', { method, notification });
    }
    if (method === HMSNotificationMethod.SFU_STATS) {
      if (window.HMS?.ON_SFU_STATS && typeof window.HMS?.ON_SFU_STATS === 'function') {
        window.HMS.ON_SFU_STATS(message.params);
      }
    }

    this.roomUpdateManager.handleNotification(method, notification);
    this.peerManager.handleNotification(method, notification);
    this.requestManager.handleNotification(method, notification);
    this.peerListManager.handleNotification(method, notification, isReconnecting);
    this.broadcastManager.handleNotification(method, notification);

    switch (method) {
      case HMSNotificationMethod.TRACK_METADATA_ADD: {
        this.trackManager.handleTrackMetadataAdd(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.TRACK_UPDATE: {
        this.trackManager.handleTrackUpdate(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.ACTIVE_SPEAKERS:
        this.activeSpeakerManager.handleActiveSpeakers(notification as SpeakerList);
        break;

      case HMSNotificationMethod.POLICY_CHANGE:
        this.policyChangeManager.handlePolicyChange(notification as PolicyParams);
        break;

      default:
        break;
    }
  }

  handleTrackAdd = (track: HMSRemoteTrack) => {
    this.trackManager.handleTrackAdd(track);
  };

  handleTrackRemove = (track: HMSRemoteTrack) => {
    this.trackManager.handleTrackRemove(track);
  };

  updateLocalPeer = ({ name, metadata }: { name?: string; metadata?: string }) => {
    const peer = this.store.getLocalPeer();
    this.peerManager.handlePeerInfoUpdate({ peer, name, data: metadata });
  };
}
