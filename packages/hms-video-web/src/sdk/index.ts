import { HMSAudioCodec, HMSConfig, HMSVideoCodec, HMSMessage, HMSMessageInput } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import HMSInterface from '../interfaces/hms';
import HMSTransport from '../transport';
import ITransportObserver from '../transport/ITransportObserver';
import HMSUpdateListener, { HMSAudioListener, HMSTrackUpdate } from '../interfaces/update-listener';
import HMSLogger, { HMSLogLevel } from '../utils/logger';
import decodeJWT from '../utils/jwt';
import { getNotificationMethod, HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import { getNotification } from './models/HMSNotifications';
import NotificationManager from './NotificationManager';
import {
  HMSTrackSource,
  HMSTrackType,
  HMSLocalAudioTrack,
  HMSLocalVideoTrack,
  HMSRemoteVideoTrack,
} from '../media/tracks';
import { HMSException } from '../error/HMSException';
import { HMSTrackSettingsBuilder } from '../media/settings';
import HMSRoom from './models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from './models/peer';
import Message from './models/HMSMessage';
import HMSLocalStream, { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import {
  HMSVideoTrackSettings,
  HMSVideoTrackSettingsBuilder,
  HMSAudioTrackSettings,
  HMSAudioTrackSettingsBuilder,
} from '../media/settings';
import { AudioSinkManager } from '../audio-sink-manager';
import { DeviceChangeEvent, DeviceManager, AudioOutputManager } from '../device-manager';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import { TransportState } from '../transport/models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { IFetchAVTrackOptions } from '../transport/ITransport';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSPreviewListener } from '../interfaces/preview-listener';
import { IErrorListener } from '../interfaces/error-listener';
import { IStore, Store } from './store';
import { HMSRemoteTrack } from '../media/streams/HMSRemoteStream';
import { DeviceChangeListener } from '../interfaces/device-change-listener';
import { HMSRoleChangeRequest } from '../interfaces';
import { HMSRole } from '../interfaces';
import RoleChangeManager, { PublishConfig } from './RoleChangeManager';
import { AutoplayError, AutoplayEvent } from '../audio-sink-manager/AudioSinkManager';

// @DISCUSS: Adding it here as a hotfix
const defaultSettings = {
  isAudioMuted: false,
  isVideoMuted: false,
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',
  videoDeviceId: 'default',
};

export class HMSSdk implements HMSInterface {
  private transport!: HMSTransport | null;
  private TAG: string = '[HMSSdk]:';
  private listener!: HMSUpdateListener | null;
  private errorListener?: IErrorListener;
  private deviceChangeListener?: DeviceChangeListener;
  private audioListener: HMSAudioListener | null = null;
  private published: boolean = false;
  private store!: IStore;
  private notificationManager!: NotificationManager;
  private deviceManager!: DeviceManager;
  private audioSinkManager!: AudioSinkManager;
  private audioOutput!: AudioOutputManager;
  private isInitialised = false;
  private transportState: TransportState = TransportState.Disconnected;
  private isReconnecting: boolean = false;
  private roleChangeManager?: RoleChangeManager;

  private initStoreAndManagers() {
    if (this.isInitialised) {
      return;
    }
    this.isInitialised = true;
    this.store = new Store();
    this.notificationManager = new NotificationManager(this.store);
    this.deviceManager = new DeviceManager(this.store);
    this.audioSinkManager = new AudioSinkManager(this.store, this.notificationManager, this.deviceManager);
    this.audioOutput = new AudioOutputManager(this.deviceManager, this.audioSinkManager);
    this.audioSinkManager.addEventListener(AutoplayError, this.handleAutoplayError);
  }

  private handleAutoplayError = (event: AutoplayEvent) => {
    this.errorListener?.onError?.(event.error);
  };

  private get localPeer(): HMSLocalPeer | undefined {
    return this.store?.getLocalPeer();
  }

  private observer: ITransportObserver = {
    onNotification: (message: any) => {
      const method = getNotificationMethod(message.method);
      const notification = getNotification(method, message.params);
      // @TODO: Notification manager needs to be refactored. The current implementation is not manageable
      // this will pollute logs
      if (method !== HMSNotificationMethod.ACTIVE_SPEAKERS) {
        HMSLogger.d(this.TAG, 'onNotification: ', message);
      }
      this.notificationManager.handleNotification(
        method,
        notification,
        this.isReconnecting,
        this.listener!,
        this.audioListener,
      );
    },

    onTrackAdd: (track: HMSRemoteTrack) => {
      this.notificationManager.handleOnTrackAdd(track);
    },

    onTrackRemove: (track: HMSRemoteTrack) => {
      this.notificationManager.handleOnTrackRemove(track);
    },

    onTrackDegrade: (track: HMSRemoteVideoTrack) => {
      HMSLogger.d(this.TAG, 'Sending Track Update Track Degraded', track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_DEGRADED, track, this.store?.getPeerByTrackId(track.trackId)!);
    },

    onTrackRestore: (track: HMSRemoteVideoTrack) => {
      HMSLogger.d(this.TAG, 'Sending Track Update Track Restored', track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_RESTORED, track, this.store?.getPeerByTrackId(track.trackId)!);
    },

    onFailure: (exception: HMSException) => {
      this.errorListener?.onError(exception);
    },

    onStateChange: async (state: TransportState, error?: HMSException) => {
      switch (state) {
        case TransportState.Joined:
          if (this.transportState === TransportState.Reconnecting) {
            this.listener?.onReconnected?.();
          }
          break;
        case TransportState.Failed:
          await this.leave();

          this.errorListener?.onError?.(error!);
          this.isReconnecting = false;
          break;
        case TransportState.Reconnecting:
          this.isReconnecting = true;
          this.listener?.onReconnecting?.(error!);
          break;
      }

      this.transportState = state;
    },
  };

  async preview(config: HMSConfig, listener: HMSPreviewListener) {
    const { roomId, userId, role } = decodeJWT(config.authToken);
    this.errorListener = listener;
    this.deviceChangeListener = listener;
    this.initStoreAndManagers();
    this.store.setConfig(config);
    this.store.setRoom(new HMSRoom(roomId, config.userName, this.store));
    const policy = this.store.getPolicyForRole(role);
    const localPeer = new HMSLocalPeer({
      name: config.userName || '',
      customerUserId: userId,
      customerDescription: config.metaData,
      role: policy,
    });

    this.store.addPeer(localPeer);
    HMSLogger.d(this.TAG, 'SDK Store', this.store);

    const roleChangeHandler = async (e: any) => {
      this.store.setPublishParams(e.detail.params.role.publishParams);
      this.notificationManager.removeEventListener('role-change', roleChangeHandler);
    };

    const policyHandler = async () => {
      this.notificationManager.removeEventListener('policy-change', policyHandler);
      const tracks = await this.initLocalTracks(config.settings!);
      tracks.forEach((track) => this.setLocalPeerTrack(track));
      this.localPeer?.audioTrack && this.initPreviewTrackAudioLevelMonitor();
      await this.initDeviceManagers();
      listener.onPreview(this.store.getRoom(), tracks);
      this.deviceChangeListener?.onDeviceChange?.(this.deviceManager.getDevices());
    };

    this.notificationManager.addEventListener('role-change', roleChangeHandler);
    this.notificationManager.addEventListener('policy-change', policyHandler);

    this.transport = new HMSTransport(this.observer, this.deviceManager, this.store);

    try {
      await this.transport.connect(
        config.authToken,
        config.initEndpoint || 'https://prod-init.100ms.live/init',
        this.localPeer!.peerId,
      );
    } catch (ex) {
      this.errorListener?.onError(ex);
    }
  }

  private handleDeviceChangeError = (event: DeviceChangeEvent) => {
    const track = event.track;
    HMSLogger.d(this.TAG, 'Device Change event', event);
    this.deviceChangeListener?.onDeviceChange?.(event.devices);
    if (event.error) {
      this.errorListener?.onError(event.error);
      if (
        [
          ErrorCodes.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE,
          ErrorCodes.TracksErrors.DEVICE_IN_USE,
          ErrorCodes.TracksErrors.DEVICE_NOT_AVAILABLE,
        ]
      ) {
        track.setEnabled(false);
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_MUTED, track, this.localPeer!);
      }
    }
  };

  join(config: HMSConfig, listener: HMSUpdateListener) {
    this.localPeer?.audioTrack?.destroyAudioLevelMonitor();
    this.listener = listener;
    this.errorListener = listener;
    this.deviceChangeListener = listener;
    this.initStoreAndManagers();
    this.store.setConfig(config);
    const { roomId, userId, role } = decodeJWT(config.authToken);

    if (!this.localPeer) {
      this.notificationManager.addEventListener('role-change', (e: any) => {
        this.store.setPublishParams(e.detail.params.role.publishParams);
      });
      this.transport = new HMSTransport(this.observer, this.deviceManager, this.store);

      const localPeer = new HMSLocalPeer({
        name: config.userName,
        customerUserId: userId,
        customerDescription: config.metaData || '',
        role: this.store.getPolicyForRole(role),
      });
      this.store.addPeer(localPeer);
    } else {
      this.localPeer.name = config.userName;
      this.localPeer.role = this.store.getPolicyForRole(role);
      this.localPeer.customerUserId = userId;
      this.localPeer.customerDescription = config.metaData || '';
    }

    this.roleChangeManager = new RoleChangeManager(
      this.store,
      this.transport!,
      this.publish.bind(this),
      this.removeTrack.bind(this),
      this.listener,
    );
    this.notificationManager.addEventListener(
      'local-peer-role-update',
      this.roleChangeManager.handleLocalPeerRoleUpdate,
    );

    HMSLogger.d(this.TAG, 'SDK Store', this.store);
    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    this.transport!.join(
      config.authToken,
      this.localPeer!.peerId,
      { name: config.userName, metaData: config.metaData || '' },
      config.initEndpoint,
      config.autoVideoSubscribe,
    ).then(async () => {
      HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
      if (this.store.getPublishParams() && !this.published) {
        await this.publish(config.settings || defaultSettings);
      }
      this.store.setRoom(new HMSRoom(roomId, config.userName, this.store));
      this.listener?.onJoin(this.store.getRoom());
    });
  }

  private cleanUp() {
    this.localPeer?.audioTrack?.destroyAudioLevelMonitor();
    this.store.cleanUp();
    this.cleanDeviceManagers();
    this.isInitialised = false;
    this.published = false;
    this.transport = null;
    this.listener = null;
    this.isReconnecting = false;
    if (this.roleChangeManager) {
      this.notificationManager.removeEventListener(
        'local-peer-role-update',
        this.roleChangeManager.handleLocalPeerRoleUpdate,
      );
    }
  }

  async leave() {
    const room = this.store.getRoom();
    if (room) {
      // browsers often put limitation on amount of time a function set on window onBeforeUnload can take in case of
      // tab refresh or close. Therefore prioritise the leave action over anything else, if tab is closed/refreshed
      // we would want leave to succeed to stop stucked peer for others. The followup cleanup however is important
      // for cases where uses stays on the page post leave.
      await this.transport?.leave();
      const roomId = room.id;
      HMSLogger.d(this.TAG, `⏳ Leaving room ${roomId}`);
      this.cleanUp();
      HMSLogger.d(this.TAG, `✅ Left room ${roomId}`);
    }
  }

  getLocalPeer() {
    return this.store.getLocalPeer();
  }

  getPeers() {
    const peers = this.store.getPeers();
    HMSLogger.d(this.TAG, `Got peers`, peers);
    return peers;
  }

  getAudioOutput() {
    return this.audioOutput;
  }

  sendMessage({ type, message, recipientPeers, recipientRoles }: HMSMessageInput) {
    if (typeof message === 'string' && message.trim() === '') {
      HMSLogger.w(this.TAG, 'sendMessage', 'Ignoring empty message send');
      return;
    }
    if (!recipientPeers?.length && !recipientRoles?.length) {
      /**
       * No recipient broadcast to all
       */
      return this.sendMessageInternal({ message, type });
    }
    return this.sendMultipleRecepientsMessage({ message, type, recipientRoles, recipientPeers });
  }

  private sendMultipleRecepientsMessage({
    message,
    type,
    recipientPeers,
    recipientRoles,
  }: HMSMessageInput): HMSMessage | void {
    const roles: HMSRole[] = [];
    const peers: HMSPeer[] = [];

    /**
     * Add all valid roles from store to roles
     */
    const knownRoles = this.store.getKnownRoles();
    recipientRoles?.forEach((role) => {
      const storeRole = knownRoles[role];
      storeRole && roles.push(storeRole);
    });

    /**
     * Add all valid peers from store to peers
     */
    recipientPeers?.forEach((peer) => {
      const storePeer = this.store.getPeerById(peer);
      storePeer && peers.push(storePeer);
    });

    if (roles.length === 0 && peers.length === 0) {
      HMSLogger.w(this.TAG, 'sendMessage', 'Invalid recipient - no corresponding peer or role found');
      return;
    }

    if (roles.length) {
      return this.sendMessageInternal({ message, recipientRoles: roles, type });
    }
    if (peers.length) {
      const hmsMessage = new Message({ sender: this.localPeer!, message, recipientPeers: peers, time: new Date() });
      /**
       * Right now server only takes in one peer_id hence the loop. But we return message with all peers
       */
      peers.forEach((peer) => {
        this.sendMessageInternal({ message, recipientPeers: [peer], type });
      });
      return hmsMessage;
    }
  }

  private sendMessageInternal({
    recipientRoles,
    recipientPeers,
    type = 'chat',
    message,
  }: Pick<HMSMessage, 'message' | 'recipientPeers' | 'recipientRoles' | 'type'>) {
    const hmsMessage = new Message({
      sender: this.localPeer!,
      type,
      message,
      recipientPeers,
      recipientRoles,
      time: new Date(),
    });
    HMSLogger.d(this.TAG, 'Sending Message:: ', hmsMessage);
    this.transport!.sendMessage(hmsMessage);
    return hmsMessage;
  }

  async startScreenShare(onStop: () => void) {
    const publishParams = this.store.getPublishParams();
    if (!publishParams) return;

    const { screen, allowed } = publishParams;
    const canPublishScreen = allowed && allowed.includes('screen');

    if (!canPublishScreen) {
      HMSLogger.e(this.TAG, `Role ${this.localPeer?.role} cannot share screen`);
      return;
    }

    if ((this.localPeer?.auxiliaryTracks?.length || 0) > 0) {
      throw Error('Cannot share multiple screens');
    }

    const dimensions = this.store.getSimulcastDimensions('screen');
    const tracks = await this.transport!.getLocalScreen(
      new HMSVideoTrackSettingsBuilder()
        // Don't cap maxBitrate for screenshare.
        // If publish params doesn't have bitRate value - don't set maxBitrate.
        .maxBitrate(screen.bitRate, false)
        .codec(screen.codec as HMSVideoCodec)
        .maxFramerate(screen.frameRate)
        .setWidth(dimensions?.width || screen.width)
        .setHeight(dimensions?.height || screen.height)
        .build(),
      new HMSAudioTrackSettingsBuilder().build(),
    );

    tracks.forEach((track) => {
      // end screenshare when video track ended
      if (track.type === 'video') {
        track.nativeTrack.onended = () => {
          this.stopEndedScreenshare(onStop);
        };
      }
    });

    await this.transport!.publish(tracks);
    tracks.forEach((track) => {
      this.localPeer?.auxiliaryTracks.push(track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    });
  }

  private async stopEndedScreenshare(onStop: () => void) {
    HMSLogger.d(this.TAG, `✅ Screenshare ended natively`);
    await this.stopScreenShare();
    onStop();
  }

  async stopScreenShare() {
    HMSLogger.d(this.TAG, `✅ Screenshare ended from app`);
    const screenTracks = this.localPeer?.auxiliaryTracks.filter((t) => t.source === 'screen');
    if (screenTracks) {
      for (let track of screenTracks) {
        await this.removeTrack(track.trackId);
      }
    }
  }

  async addTrack(track: MediaStreamTrack, source: HMSTrackSource = 'regular'): Promise<void> {
    const type = track.kind;
    const nativeStream = new MediaStream([track]);
    const stream = new HMSLocalStream(nativeStream);

    const TrackKlass = type === 'audio' ? HMSLocalAudioTrack : HMSLocalVideoTrack;
    const hmsTrack = new TrackKlass(stream, track, source);

    await this.transport?.publish([hmsTrack]);
    this.localPeer?.auxiliaryTracks.push(hmsTrack);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsTrack, this.localPeer!);
  }

  async removeTrack(trackId: string) {
    const track = this.localPeer?.auxiliaryTracks.find((t) => t.trackId === trackId);
    if (track) {
      await this.transport!.unpublish([track]);
      this.localPeer!.auxiliaryTracks.splice(this.localPeer!.auxiliaryTracks.indexOf(track), 1);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, this.localPeer!);
    }
  }

  setAnalyticsLevel(level: HMSAnalyticsLevel) {
    analyticsEventsService.level = level;
  }

  setLogLevel(level: HMSLogLevel) {
    HMSLogger.level = level;
  }

  addAudioListener(audioListener: HMSAudioListener) {
    this.audioListener = audioListener;
  }

  changeRole(forPeer: HMSRemotePeer, toRole: string, force: boolean = false) {
    if (!this.localPeer?.role?.permissions.changeRole) {
      throw ErrorFactory.GenericErrors.Unknown(HMSAction.TRACK, 'Do not have permission to change roles');
    }

    if (!forPeer.role || forPeer.role.name === toRole) {
      return;
    }

    this.transport?.changeRole(forPeer, toRole, force);
  }

  acceptChangeRole(request: HMSRoleChangeRequest) {
    this.transport?.acceptRoleChange(request);
  }

  getRoles(): HMSRole[] {
    return Object.values(this.store.getKnownRoles());
  }

  private async publish(initialSettings: InitialSettings, publishConfig?: PublishConfig) {
    const tracks = await this.initLocalTracks(initialSettings, publishConfig);
    await this.setAndPublishTracks(tracks);
    this.published = true;
  }

  private async setAndPublishTracks(tracks: HMSLocalTrack[]) {
    for (const track of tracks) {
      await this.transport!.publish([track]);
      this.setLocalPeerTrack(track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    }
    await this.initDeviceManagers();
    this.deviceChangeListener?.onDeviceChange?.(this.deviceManager.getDevices());
  }

  private setLocalPeerTrack(track: HMSLocalTrack) {
    switch (track.type) {
      case HMSTrackType.AUDIO:
        this.localPeer!.audioTrack = track as HMSLocalAudioTrack;
        break;

      case HMSTrackType.VIDEO:
        this.localPeer!.videoTrack = track as HMSLocalVideoTrack;
        break;
    }
  }

  private async initLocalTracks(
    initialSettings: InitialSettings,
    publishConfig: PublishConfig = { publishAudio: true, publishVideo: true },
  ): Promise<HMSLocalTrack[]> {
    const publishParams = this.store.getPublishParams();
    if (!publishParams) return [];

    const { audio, video, allowed } = publishParams;
    const canPublishAudio = Boolean(allowed && allowed.includes('audio'));
    const canPublishVideo = Boolean(allowed && allowed.includes('video'));

    if ((!canPublishAudio && !canPublishVideo) || (!publishConfig.publishAudio && !publishConfig.publishVideo)) {
      return [];
    }
    const { audioInputDeviceId, videoDeviceId } = initialSettings;
    let tracks: Array<HMSLocalTrack> = [];
    let audioSettings: HMSAudioTrackSettings | null = null;
    let videoSettings: HMSVideoTrackSettings | null = null;
    if (canPublishAudio && publishConfig.publishAudio) {
      audioSettings = new HMSAudioTrackSettingsBuilder()
        .codec(audio.codec as HMSAudioCodec)
        .maxBitrate(audio.bitRate)
        .deviceId(audioInputDeviceId)
        .build();
    }
    if (canPublishVideo && publishConfig.publishVideo) {
      const dimensions = this.store.getSimulcastDimensions('regular');
      videoSettings = new HMSVideoTrackSettingsBuilder()
        .codec(video.codec as HMSVideoCodec)
        .maxBitrate(video.bitRate)
        .maxFramerate(video.frameRate)
        .setWidth(dimensions?.width || video.width) // take simulcast width if available
        .setHeight(dimensions?.height || video.height) // take simulcast width if available
        .deviceId(videoDeviceId)
        .build();
    }

    const trackSettings = new HMSTrackSettingsBuilder().video(videoSettings).audio(audioSettings).build();
    const localTracks = this.store.getLocalPeerTracks();
    const videoTrack = localTracks.find((t) => t.type === HMSTrackType.VIDEO && t.source === 'regular');
    const audioTrack = localTracks.find((t) => t.type === HMSTrackType.AUDIO && t.source === 'regular');
    let fetchTrackOptions: IFetchAVTrackOptions;
    try {
      fetchTrackOptions = {
        audio: canPublishAudio && !audioTrack && (initialSettings.isAudioMuted ? 'empty' : true),
        video: canPublishVideo && !videoTrack && (initialSettings.isVideoMuted ? 'empty' : true),
      };
      HMSLogger.d(this.TAG, 'Init Local Tracks', { fetchTrackOptions });
      tracks = await this.transport!.getEmptyLocalTracks(fetchTrackOptions, trackSettings);
    } catch (error) {
      if (error instanceof HMSException && error.action === HMSAction.TRACK) {
        this.errorListener?.onError?.(error);

        const audioFailure = error.message.includes('audio');
        const videoFailure = error.message.includes('video');
        fetchTrackOptions = {
          audio: canPublishAudio && (audioFailure ? 'empty' : true),
          video: canPublishVideo && (videoFailure ? 'empty' : true),
        };
        HMSLogger.w(this.TAG, 'Fetch AV Tracks failed', { fetchTrackOptions }, error);
        tracks = await this.transport!.getEmptyLocalTracks(fetchTrackOptions, trackSettings);
      } else {
        this.errorListener?.onError?.(ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, error.message));
      }
    }

    /**
     * concat local tracks only if both are true which means it is either join or switched from a role
     * with no tracks earlier.
     * the reason we need this is for preview API to work, in case of preview we want to publish the same
     * tracks which were shown and are already part of the local peer instead of creating new ones.
     * */
    if (publishConfig.publishAudio && publishConfig.publishVideo) {
      return tracks.concat(localTracks);
    }
    return tracks;
  }

  private async initDeviceManagers() {
    await this.deviceManager.init();
    this.deviceManager.addEventListener('audio-device-change', this.handleDeviceChangeError);
    this.deviceManager.addEventListener('video-device-change', this.handleDeviceChangeError);
    this.audioSinkManager.init(this.store.getConfig()?.audioSinkElementId);
  }

  private cleanDeviceManagers() {
    this.deviceManager.removeEventListener('audio-device-change', this.handleDeviceChangeError);
    this.deviceManager.removeEventListener('video-device-change', this.handleDeviceChangeError);
    this.deviceManager.cleanUp();
    this.audioSinkManager.removeEventListener(AutoplayError, this.handleAutoplayError);
    this.audioSinkManager.cleanUp();
  }

  private initPreviewTrackAudioLevelMonitor() {
    this.localPeer?.audioTrack?.initAudioLevelMonitor();
    this.localPeer?.audioTrack?.audioLevelMonitor?.on('AUDIO_LEVEL_UPDATE', (audioLevelUpdate) => {
      const hmsSpeakers = audioLevelUpdate
        ? [{ audioLevel: audioLevelUpdate.audioLevel, peer: this.localPeer!, track: this.localPeer?.audioTrack! }]
        : [];
      this.store.updateSpeakers(hmsSpeakers);
      this.audioListener?.onAudioLevelUpdate(hmsSpeakers);
    });
  }
}
