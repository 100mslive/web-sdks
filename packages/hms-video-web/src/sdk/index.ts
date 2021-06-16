import HMSConfig from '../interfaces/config';
import InitialSettings from '../interfaces/settings';
import HMSInterface from '../interfaces/hms';
import HMSPeer from '../interfaces/hms-peer';
import HMSTransport from '../transport';
import ITransportObserver from '../transport/ITransportObserver';
import HMSUpdateListener, { HMSAudioListener, HMSTrackUpdate } from '../interfaces/update-listener';
import HMSLogger, { HMSLogLevel } from '../utils/logger';
import decodeJWT from '../utils/jwt';
import { getNotificationMethod, HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import { getNotification } from './models/HMSNotifications';
import NotificationManager from './NotificationManager';
import HMSTrack from '../media/tracks/HMSTrack';
import { HMSTrackType } from '../media/tracks';
import HMSException from '../error/HMSException';
import { HMSTrackSettingsBuilder } from '../media/settings/HMSTrackSettings';
import HMSRoom from './models/HMSRoom';
import { v4 as uuidv4 } from 'uuid';
import Peer from '../peer';
import Message from './models/HMSMessage';
import HMSLocalStream, { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import HMSVideoTrackSettings, { HMSVideoTrackSettingsBuilder } from '../media/settings/HMSVideoTrackSettings';
import HMSAudioTrackSettings, { HMSAudioTrackSettingsBuilder } from '../media/settings/HMSAudioTrackSettings';
import HMSAudioSinkManager from '../audio-sink-manager';
import DeviceManager from './models/DeviceManager';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import { TransportState } from '../transport/models/TransportState';
import { HMSAction } from '../error/ErrorFactory';

// @DISCUSS: Adding it here as a hotfix
const defaultSettings = {
  isAudioMuted: false,
  isVideoMuted: false,
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',
  videoDeviceId: 'default',
};

export class HMSSdk implements HMSInterface {
  transport!: HMSTransport | null;
  roomId!: string | null;
  localPeer!: HMSPeer | null;

  private TAG: string = '[HMSSdk]:';
  private notificationManager: NotificationManager = new NotificationManager();
  private listener!: HMSUpdateListener | null;
  private audioListener: HMSAudioListener | null = null;
  private audioSinkManager!: HMSAudioSinkManager;
  private hmsRoom?: HMSRoom | null;
  private published: boolean = false;
  private publishParams: any = null;
  private deviceManager: DeviceManager = new DeviceManager();
  private transportState: TransportState = TransportState.Disconnected;
  private isReconnecting: boolean = false;

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

    onTrackAdd: (track: HMSTrack) => {
      this.notificationManager.handleOnTrackAdd(track);
    },

    onTrackRemove: (track: HMSTrack) => {
      this.notificationManager.handleOnTrackRemove(track);
    },

    onFailure: (exception: HMSException) => {
      this.listener?.onError(exception);
    },

    onStateChange: (state: TransportState, error?: HMSException) => {
      switch (state) {
        case TransportState.Joined:
          if (this.transportState === TransportState.Reconnecting) {
            this.listener?.onReconnected();
          }
          break;
        case TransportState.Failed:
          this.listener?.onError(error!);
          this.isReconnecting = false;
          break;
        case TransportState.Reconnecting:
          this.isReconnecting = true;
          break;
        case TransportState.WaitingToReconnect:
          this.listener?.onReconnecting(error!);
          break;
      }

      this.transportState = state;
    },
  };

  join(config: HMSConfig, listener: HMSUpdateListener) {
    this.notificationManager.addEventListener('role-change', (e: any) => {
      this.publishParams = e.detail.params.role.publishParams;
    });
    this.transport = new HMSTransport(this.observer);
    this.listener = listener;
    this.audioSinkManager = new HMSAudioSinkManager(this.notificationManager, config.audioSinkElementId);
    const { roomId, userId, role } = decodeJWT(config.authToken);

    const peerId = uuidv4();

    this.localPeer = new Peer({
      peerId,
      name: config.userName,
      isLocal: true,
      customerUserId: userId,
      role,
      customerDescription: config.metaData || '',
    });
    this.notificationManager.localPeer = this.localPeer;

    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    this.transport
      .join(
        config.authToken,
        this.localPeer.peerId,
        { name: config.userName, metaData: config.metaData || '' },
        config.initEndpoint,
        config.autoVideoSubscribe,
      )
      .then(async () => {
        HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
        this.roomId = roomId;
        if (this.publishParams && !this.published) {
          await this.publish(config.settings || defaultSettings);
        }
        this.listener?.onJoin(this.createRoom());
      });
  }

  private cleanUp() {
    this.audioSinkManager.cleanUp();
    this.notificationManager.cleanUp();

    this.published = false;
    this.localPeer = null;
    this.roomId = null;
    this.hmsRoom = null;
    this.transport = null;
    this.listener = null;
    this.isReconnecting = false;
  }

  async leave() {
    if (this.roomId) {
      const roomId = this.roomId;
      HMSLogger.d(this.TAG, `⏳ Leaving room ${roomId}`);
      this.localPeer?.audioTrack?.nativeTrack.stop();
      this.localPeer?.videoTrack?.nativeTrack.stop();
      this.localPeer?.auxiliaryTracks.forEach((track) => track.nativeTrack.stop());
      await this.transport?.leave();
      this.cleanUp();
      HMSLogger.d(this.TAG, `✅ Left room ${roomId}`);
    }
  }

  getLocalPeer(): HMSPeer {
    return this.localPeer!;
  }

  getPeers(): HMSPeer[] {
    const remotePeers = Array.from(this.notificationManager.hmsPeerList, (x) => x[1]);
    const peers = this.localPeer ? [...remotePeers, this.getLocalPeer()] : remotePeers;
    HMSLogger.d(this.TAG, `Got peers`, peers);
    return peers;
  }

  sendMessage(type: string, message: string, receiver?: string) {
    const hmsMessage = new Message({ sender: this.localPeer!.peerId, type, message, receiver });
    HMSLogger.d(this.TAG, 'Sending Message:: ', hmsMessage);
    this.transport!.sendMessage(hmsMessage);
    return hmsMessage;
  }

  async startScreenShare(onStop: () => void) {
    const { screen, allowed } = this.publishParams;
    const canPublishScreen = allowed && allowed.includes('screen');

    if (!canPublishScreen) {
      HMSLogger.e(this.TAG, `Role ${this.localPeer?.role} cannot share screen`);
      return;
    }

    if ((this.localPeer?.auxiliaryTracks?.length || 0) > 0) {
      throw Error('Cannot share multiple screens');
    }

    const track = await this.transport!.getLocalScreen(
      new HMSVideoTrackSettingsBuilder()
        // Don't cap maxBitrate for screenshare.
        // If publish params doesn't have bitRate value - don't set maxBitrate.
        .maxBitrate(screen.bitRate, false)
        .codec(screen.codec)
        .maxFramerate(screen.frameRate)
        .setWidth(screen.width)
        .setHeight(screen.height)
        .build(),
    );
    track.nativeTrack.onended = () => {
      this.stopEndedScreenshare(onStop);
    };
    await this.transport!.publish([track]);
    this.localPeer?.auxiliaryTracks.push(track);
  }

  private async stopEndedScreenshare(onStop: () => void) {
    HMSLogger.d(this.TAG, `✅ Screenshare ended natively`);
    await this.stopScreenShare();
    onStop();
  }

  async stopScreenShare() {
    HMSLogger.d(this.TAG, `✅ Screenshare ended from app`);
    const track = this.localPeer?.auxiliaryTracks.find((t) => t.type === HMSTrackType.VIDEO && t.source === 'screen');
    if (track) {
      this.transport!.unpublish([track]);
      this.localPeer!.auxiliaryTracks.splice(this.localPeer!.auxiliaryTracks.indexOf(track), 1);
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

  private async publish(initialSettings: InitialSettings) {
    const { audioInputDeviceId, videoDeviceId } = initialSettings;
    const { audio, video, allowed } = this.publishParams;
    const canPublishAudio = allowed && allowed.includes('audio');
    const canPublishVideo = allowed && allowed.includes('video');
    HMSLogger.d(this.TAG, `Device IDs :  ${audioInputDeviceId} ,  ${videoDeviceId} `);
    const audioSettings: HMSAudioTrackSettings = new HMSAudioTrackSettingsBuilder()
      .codec(audio.codec)
      .maxBitrate(audio.bitRate)
      .deviceId(audioInputDeviceId)
      .build();
    const videoSettings: HMSVideoTrackSettings = new HMSVideoTrackSettingsBuilder()
      .codec(video.codec)
      .maxBitrate(video.bitRate)
      .maxFramerate(video.frameRate)
      .setWidth(video.width)
      .setHeight(video.height)
      .deviceId(videoDeviceId)
      .build();

    if (canPublishAudio || canPublishVideo) {
      const trackSettings = new HMSTrackSettingsBuilder()
        .video(canPublishVideo ? videoSettings : null)
        .audio(canPublishAudio ? audioSettings : null)
        .build();
      let tracks: Array<HMSLocalTrack> = [];
      let deviceFailure;
      try {
        tracks = (await this.transport?.getLocalTracks(trackSettings)) || [];
      } catch (error) {
        if (error instanceof HMSException && error.action === HMSAction.TRACK) {
          const audioFailure = error.message.includes('audio');
          const videoFailure = error.message.includes('video');
          deviceFailure = { audio: audioFailure, video: videoFailure };
          tracks = await HMSLocalStream.getEmptyLocalTracks(deviceFailure, trackSettings);
        } else {
          throw error;
        }
      }
      this.setAndPublishTracks(tracks, initialSettings, deviceFailure);
      this.published = true;
      this.deviceManager.localPeer = this.localPeer;
    }
  }

  private setAndPublishTracks(
    tracks: HMSLocalTrack[],
    initialSettings: InitialSettings,
    deviceFailure = { audio: false, video: false },
  ) {
    tracks.forEach(async (track) => {
      this.setLocalPeerTrack(track);

      await this.transport!.publish([track]);

      if (!deviceFailure.audio && initialSettings.isAudioMuted && this.localPeer?.audioTrack) {
        await this.localPeer.audioTrack.setEnabled(false);
      }
      if (!deviceFailure.video && initialSettings.isVideoMuted && this.localPeer?.videoTrack) {
        await this.localPeer.videoTrack.setEnabled(false);
      }

      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    });
  }

  private setLocalPeerTrack(track: HMSLocalTrack) {
    switch (track.type) {
      case HMSTrackType.AUDIO:
        this.localPeer!.audioTrack = track;
        break;

      case HMSTrackType.VIDEO:
        this.localPeer!.videoTrack = track;
        break;
    }
  }

  createRoom() {
    const hmsPeerList = this.getPeers();
    this.hmsRoom = new HMSRoom(this.localPeer!.peerId, '', hmsPeerList);
    return this.hmsRoom;
  }
}
