import HMSConfig from '../interfaces/config';
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
import { HMSTrackSource } from '../media/tracks/HMSTrack';
import { HMSTrackType } from '../media/tracks';
import { HMSException } from '../error/HMSException';
import { HMSTrackSettingsBuilder } from '../media/settings/HMSTrackSettings';
import HMSRoom from './models/HMSRoom';
import { HMSLocalPeer } from './models/peer';
import Message from './models/HMSMessage';
import HMSLocalStream, { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import HMSVideoTrackSettings, { HMSVideoTrackSettingsBuilder } from '../media/settings/HMSVideoTrackSettings';
import HMSAudioTrackSettings, { HMSAudioTrackSettingsBuilder } from '../media/settings/HMSAudioTrackSettings';
import HMSAudioSinkManager from '../audio-sink-manager';
import DeviceManager, { DeviceChangeEvent } from './models/DeviceManager';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import { HMSLocalAudioTrack } from '../media/tracks/HMSLocalAudioTrack';
import { HMSLocalVideoTrack } from '../media/tracks/HMSLocalVideoTrack';
import { TransportState } from '../transport/models/TransportState';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { IFetchAVTrackOptions } from '../transport/ITransport';
import { ErrorCodes } from '../error/ErrorCodes';
import { HMSPreviewListener } from '../interfaces/preview-listener';
import { IErrorListener } from '../interfaces/error-listener';
import { HMSRemoteTrack } from '../media/streams/HMSRemoteStream';
import HMSPolicy from '../interfaces/policy';

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
  localPeer!: HMSLocalPeer | null;

  private TAG: string = '[HMSSdk]:';
  private notificationManager: NotificationManager = new NotificationManager(this);
  private listener!: HMSUpdateListener | null;
  private errorListener?: IErrorListener;
  private audioListener: HMSAudioListener | null = null;
  private audioSinkManager!: HMSAudioSinkManager;
  private hmsRoom?: HMSRoom | null;
  private published: boolean = false;
  private publishParams: any = null;
  private deviceManager: DeviceManager = new DeviceManager();
  private transportState: TransportState = TransportState.Disconnected;
  private isReconnecting: boolean = false;
  private localTracks?: HMSLocalTrack[];
  public knownRoles: { [role: string]: HMSPolicy } = {};

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
    this.roomId = roomId;
    this.errorListener = listener;
    this.localPeer = new HMSLocalPeer({
      name: config.userName || '',
      role: role,
      customerUserId: userId,
      customerDescription: config.metaData,
      policy: this.knownRoles[role],
    });
    this.notificationManager.localPeer = this.localPeer;

    const roleChangeHandler = async (e: any) => {
      this.publishParams = e.detail.params.role.publishParams;
      this.notificationManager.removeEventListener('role-change', roleChangeHandler);
      const tracks = await this.initLocalTracks(config.settings!);
      tracks.forEach((track) => this.setLocalPeerTrack(track));
      listener.onPreview(this.getRoom(), tracks);
    };

    this.notificationManager.addEventListener('role-change', roleChangeHandler);

    this.transport = new HMSTransport(this.observer);

    try {
      await this.transport.connect(
        config.authToken,
        config.initEndpoint || 'https://prod-init.100ms.live/init',
        this.localPeer.peerId,
      );
    } catch (ex) {
      this.errorListener?.onError(ex);
    }
  }

  private handleDeviceChangeError(event: DeviceChangeEvent | undefined) {
    if (!event) return;
    const track = event.track;
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
  }

  join(config: HMSConfig, listener: HMSUpdateListener) {
    this.listener = listener;
    this.errorListener = listener;
    this.deviceManager.init();
    this.deviceManager.addEventListener('audio-device-change', this.handleDeviceChangeError);
    this.deviceManager.addEventListener('video-device-change', this.handleDeviceChangeError);
    this.audioSinkManager = new HMSAudioSinkManager(
      this.notificationManager,
      this.deviceManager,
      config.audioSinkElementId,
    );
    const { roomId, userId, role } = decodeJWT(config.authToken);

    if (!this.localPeer) {
      this.notificationManager.addEventListener('role-change', (e: any) => {
        this.publishParams = e.detail.params.role.publishParams;
      });
      this.transport = new HMSTransport(this.observer);

      this.localPeer = new HMSLocalPeer({
        name: config.userName,
        customerUserId: userId,
        role,
        customerDescription: config.metaData || '',
        policy: this.knownRoles[role],
      });
      this.notificationManager.localPeer = this.localPeer;
    } else {
      this.localPeer.name = config.userName;
    }

    HMSLogger.d(this.TAG, `⏳ Joining room ${roomId}`);

    this.transport!.join(
      config.authToken,
      this.localPeer.peerId,
      { name: config.userName, metaData: config.metaData || '' },
      config.initEndpoint,
      config.autoVideoSubscribe,
    ).then(async () => {
      HMSLogger.d(this.TAG, `✅ Joined room ${roomId}`);
      this.roomId = roomId;
      if (this.publishParams && !this.published) {
        await this.publish(config.settings || defaultSettings);
      }
      this.listener?.onJoin(this.getRoom());
    });
  }

  private cleanUp() {
    this.audioSinkManager?.cleanUp();
    this.notificationManager.cleanUp();
    this.deviceManager.cleanUp();

    this.published = false;
    this.localPeer = null;
    this.roomId = null;
    this.hmsRoom = null;
    this.transport = null;
    this.listener = null;
    this.isReconnecting = false;
    this.localTracks = [];
  }

  async leave() {
    if (this.roomId) {
      // Start transport.leave and parallelly stop the tracks
      const transportLeave = this.transport?.leave();
      const roomId = this.roomId;
      HMSLogger.d(this.TAG, `⏳ Leaving room ${roomId}`);
      this.localPeer?.audioTrack?.nativeTrack.stop();
      this.localPeer?.videoTrack?.nativeTrack.stop();
      this.localPeer?.auxiliaryTracks.forEach((track) => track.nativeTrack.stop());
      this.cleanUp();

      // wait for transport.leave to complete before returning from this function
      await transportLeave;
      HMSLogger.d(this.TAG, `✅ Left room ${roomId}`);
    }
  }

  getLocalPeer() {
    return this.localPeer!;
  }

  getPeers() {
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

    const tracks = await this.transport!.getLocalScreen(
      new HMSVideoTrackSettingsBuilder()
        // Don't cap maxBitrate for screenshare.
        // If publish params doesn't have bitRate value - don't set maxBitrate.
        .maxBitrate(screen.bitRate, false)
        .codec(screen.codec)
        .maxFramerate(screen.frameRate)
        .setWidth(screen.width)
        .setHeight(screen.height)
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
      track.nativeTrack.stop();
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

  private async publish(initialSettings: InitialSettings) {
    const tracks = await this.initLocalTracks(initialSettings);
    this.setAndPublishTracks(tracks);
    this.published = true;
    this.deviceManager.localPeer = this.localPeer;
  }

  private setAndPublishTracks(tracks: HMSLocalTrack[]) {
    tracks.forEach(async (track) => {
      this.setLocalPeerTrack(track);
      await this.transport!.publish([track]);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, this.localPeer!);
    });
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

  private async initLocalTracks(initialSettings: InitialSettings): Promise<HMSLocalTrack[]> {
    if (this.localTracks && this.localTracks.length) {
      return this.localTracks;
    }

    const { audioInputDeviceId, videoDeviceId } = initialSettings;
    const { audio, video, allowed } = this.publishParams;
    const canPublishAudio = Boolean(allowed && allowed.includes('audio'));
    const canPublishVideo = Boolean(allowed && allowed.includes('video'));
    HMSLogger.d(this.TAG, `Device IDs :  ${audioInputDeviceId} ,  ${videoDeviceId} `);
    let tracks: Array<HMSLocalTrack> = [];

    if (canPublishAudio || canPublishVideo) {
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

      const trackSettings = new HMSTrackSettingsBuilder()
        .video(canPublishVideo ? videoSettings : null)
        .audio(canPublishAudio ? audioSettings : null)
        .build();
      let fetchTrackOptions: IFetchAVTrackOptions;
      try {
        fetchTrackOptions = {
          audio: canPublishAudio && (initialSettings.isAudioMuted ? 'empty' : true),
          video: canPublishVideo && (initialSettings.isVideoMuted ? 'empty' : true),
        };
        HMSLogger.d(this.TAG, 'Join Publish', { fetchTrackOptions });
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
    }
    this.localTracks = tracks;

    return this.localTracks;
  }

  private getRoom(): HMSRoom {
    if (this.hmsRoom) {
      return this.hmsRoom;
    }
    this.hmsRoom = new HMSRoom(this.localPeer!.peerId, '', this);
    return this.hmsRoom;
  }
}
