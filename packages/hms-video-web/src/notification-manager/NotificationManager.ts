import { HMSAudioListener, HMSConnectionQualityListener, HMSUpdateListener } from '../interfaces';
import { HMSRemoteTrack } from '../media/tracks';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';
import { HMSNotificationMethod } from './HMSNotificationMethod';
import {
  ConnectionQualityList,
  OnTrackLayerUpdateNotification,
  PolicyParams,
  SpeakerList,
  TrackStateNotification,
} from './HMSNotifications';
import { ActiveSpeakerManager } from './managers/ActiveSpeakerManager';
import { BroadcastManager } from './managers/BroadcastManager';
import { PeerListManager } from './managers/PeerListManager';
import { PeerManager } from './managers/PeerManager';
import { PolicyChangeManager } from './managers/PolicyChangeManager';
import { RequestManager } from './managers/RequestManager';
import { RoomUpdateManager } from './managers/RoomUpdateManager';
import { TrackManager } from './managers/TrackManager';
import { ConnectionQualityManager } from './managers/ConnectionQualityManager';
import { EventBus } from '../events/EventBus';

export class NotificationManager {
  private TAG = '[HMSNotificationManager]';
  private trackManager: TrackManager;
  private peerManager: PeerManager;
  private peerListManager: PeerListManager;
  private activeSpeakerManager: ActiveSpeakerManager;
  private connectionQualityManager: ConnectionQualityManager;
  private broadcastManager: BroadcastManager;
  private policyChangeManager: PolicyChangeManager;
  private requestManager: RequestManager;
  private roomUpdateManager: RoomUpdateManager;
  /**
   * room state can be sent before join in preview stage as well but that is outdated, based on
   * eventual consistency and doesn't have all data. If we get at least one consistent room update
   * from that point onwards we can rely on live server updates and ignore periodic room state messages
   */
  private hasConsistentRoomStateArrived = false;

  constructor(
    private store: IStore,
    eventBus: EventBus,
    private listener?: HMSUpdateListener,
    private audioListener?: HMSAudioListener,
    private connectionQualityListener?: HMSConnectionQualityListener,
  ) {
    this.trackManager = new TrackManager(this.store, eventBus, this.listener);
    this.peerManager = new PeerManager(this.store, this.trackManager, this.listener);
    this.peerListManager = new PeerListManager(this.store, this.peerManager, this.trackManager, this.listener);
    this.broadcastManager = new BroadcastManager(this.store, this.listener);
    this.policyChangeManager = new PolicyChangeManager(this.store, eventBus);
    this.requestManager = new RequestManager(this.store, this.listener);
    this.activeSpeakerManager = new ActiveSpeakerManager(this.store, this.listener, this.audioListener);
    this.connectionQualityManager = new ConnectionQualityManager(this.connectionQualityListener);
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

  setConnectionQualityListener(qualityListener?: HMSConnectionQualityListener) {
    this.connectionQualityListener = qualityListener;
    this.connectionQualityManager.listener = qualityListener;
  }

  handleNotification(message: { method: string; params: any }, isReconnecting = false) {
    const method = message.method as HMSNotificationMethod;
    const notification = message.params;

    if (
      ![
        HMSNotificationMethod.ACTIVE_SPEAKERS,
        HMSNotificationMethod.SFU_STATS,
        HMSNotificationMethod.CONNECTION_QUALITY,
      ].includes(method)
    ) {
      HMSLogger.d(this.TAG, `Received notification - ${method}`, { notification });
    }
    if (method === HMSNotificationMethod.SFU_STATS) {
      if (window.HMS?.ON_SFU_STATS && typeof window.HMS?.ON_SFU_STATS === 'function') {
        window.HMS.ON_SFU_STATS(message.params);
      }
    }

    if (this.ignoreNotification(method)) {
      return;
    }

    this.roomUpdateManager.handleNotification(method, notification);
    this.peerManager.handleNotification(method, notification);
    this.requestManager.handleNotification(method, notification);
    this.peerListManager.handleNotification(method, notification, isReconnecting);
    this.broadcastManager.handleNotification(method, notification);
    this.handleIsolatedMethods(method, notification);
  }

  // eslint-disable-next-line complexity
  handleIsolatedMethods(method: string, notification: any) {
    switch (method) {
      case HMSNotificationMethod.TRACK_METADATA_ADD: {
        this.trackManager.handleTrackMetadataAdd(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.TRACK_UPDATE: {
        this.trackManager.handleTrackUpdate(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.ON_SFU_TRACK_LAYER_UPDATE: {
        this.trackManager.handleTrackLayerUpdate(notification as OnTrackLayerUpdateNotification);
        break;
      }
      case HMSNotificationMethod.ACTIVE_SPEAKERS:
        this.activeSpeakerManager.handleActiveSpeakers(notification as SpeakerList);
        break;

      case HMSNotificationMethod.CONNECTION_QUALITY:
        this.connectionQualityManager.handleQualityUpdate(notification as ConnectionQualityList);
        break;

      case HMSNotificationMethod.POLICY_CHANGE:
        this.policyChangeManager.handlePolicyChange(notification as PolicyParams);
        break;

      default:
        break;
    }
  }

  ignoreNotification = (method: string): boolean => {
    if (method === HMSNotificationMethod.PEER_LIST) {
      this.hasConsistentRoomStateArrived = true;
    } else if (method === HMSNotificationMethod.ROOM_STATE) {
      // ignore periodic inconsistent room state if consistent one has arrived at least once
      return this.hasConsistentRoomStateArrived;
    }
    return false;
  };

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
