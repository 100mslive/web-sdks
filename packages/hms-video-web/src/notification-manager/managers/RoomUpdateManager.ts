import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
import { HLSVariant, HMSHLS, HMSHLSRecording, HMSRoomUpdate, HMSUpdateListener } from '../../interfaces';
import { ServerError } from '../../interfaces/internal';
import { IStore } from '../../sdk/store';
import { convertDateNumToDate } from '../../utils/date';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import {
  HLSINITNotification,
  HLSNotification,
  PeerListNotification,
  PeriodicRoomState,
  RecordingNotification,
  RoomInfo,
  RoomState,
  RTMPNotification,
  SessionInfo,
} from '../HMSNotifications';

export class RoomUpdateManager {
  private readonly TAG = '[RoomUpdateManager]';

  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

  // eslint-disable-next-line complexity
  handleNotification(method: HMSNotificationMethod, notification: any) {
    switch (method) {
      case HMSNotificationMethod.PEER_LIST:
        this.onRoomState((notification as PeerListNotification).room);
        break;
      case HMSNotificationMethod.RTMP_START:
        this.onRTMPStart(notification as RTMPNotification);
        break;
      case HMSNotificationMethod.RTMP_STOP:
        this.onRTMPStop(notification as RTMPNotification);
        break;
      case HMSNotificationMethod.RECORDING_START:
        this.onRecordingStart(notification as RecordingNotification);
        break;
      case HMSNotificationMethod.RECORDING_STOP:
        this.onRecordingStop(notification as RecordingNotification);
        break;
      case HMSNotificationMethod.ROOM_STATE:
        this.handlePreviewRoomState(notification as PeriodicRoomState);
        break;
      case HMSNotificationMethod.ROOM_INFO:
        this.handleRoomInfo(notification as RoomInfo);
        break;
      case HMSNotificationMethod.SESSION_INFO:
        this.handleSessionInfo(notification as SessionInfo);
        break;
      case HMSNotificationMethod.HLS_INIT:
        this.InitHLS(notification as HLSINITNotification);
        break;
      default:
        this.onHLS(method, notification as HLSNotification);
        break;
    }
  }

  private handleRoomInfo(notification: RoomInfo) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on session info - room not present');
      return;
    }
    room.description = notification.description;
    room.large_room_optimization = notification.large_room_optimization;
    room.max_size = notification.max_size;
    room.name = notification.name;
  }

  private handleSessionInfo(notification: SessionInfo) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on session info - room not present');
      return;
    }
    room.sessionId = notification.session_id;
    if (room.peerCount !== notification.peer_count) {
      room.peerCount = notification.peer_count;
      this.listener?.onRoomUpdate(HMSRoomUpdate.ROOM_PEER_COUNT_UPDATED, room);
    }
  }

  private handlePreviewRoomState(notification: PeriodicRoomState) {
    const { room } = notification;
    this.onRoomState(room);
  }

  private onRoomState(roomNotification: RoomState) {
    const { recording, streaming, session_id, started_at, name } = roomNotification;
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on room state - room not present');
      return;
    }

    room.name = name;
    room.recording.server.running = !!recording?.sfu.enabled;
    room.recording.browser.running = !!recording?.browser.enabled;
    room.rtmp.running = !!streaming?.rtmp?.enabled;
    room.rtmp.startedAt = convertDateNumToDate(streaming?.rtmp?.started_at);
    room.recording.server.startedAt = convertDateNumToDate(recording?.sfu.started_at);
    room.recording.browser.startedAt = convertDateNumToDate(recording?.browser.started_at);
    room.recording.hls = this.getPeerListHLSRecording(recording);
    room.hls = this.convertHls(streaming?.hls, streaming?.hls?.variants);
    room.sessionId = session_id;
    room.startedAt = convertDateNumToDate(started_at);
    this.listener?.onRoomUpdate(HMSRoomUpdate.RECORDING_STATE_UPDATED, room);
  }

  private onRTMPStart(notification: RTMPNotification) {
    this.setRTMPStatus(!notification.error?.code, notification);
  }

  private onRTMPStop(notification: RTMPNotification) {
    this.setRTMPStatus(false, notification);
  }

  private onRecordingStart(notification: RecordingNotification) {
    this.setRecordingStatus(!notification.error?.code, notification);
  }

  private onRecordingStop(notification: RecordingNotification) {
    this.setRecordingStatus(false, notification);
  }

  private InitHLS(notification: HLSINITNotification) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on hls - room not present');
      return;
    }
    if (!notification?.variants) {
      return;
    }
    room.hls.variants = [];
    notification.variants.forEach((_, index) => {
      room.hls.variants.push({
        initialisedAt: convertDateNumToDate(notification?.variants?.[index].initialised_at),
        url: '',
      });
    });
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private onHLS(method: string, notification: HLSNotification) {
    if (
      ![HMSNotificationMethod.HLS_INIT, HMSNotificationMethod.HLS_START, HMSNotificationMethod.HLS_STOP].includes(
        method as HMSNotificationMethod,
      )
    ) {
      return;
    }
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on hls - room not present');
      return;
    }

    notification.enabled =
      HMSNotificationMethod.HLS_START === (method as HMSNotificationMethod) && !notification.error?.code;
    room.hls = this.convertHls(notification, room.hls.variants);
    room.recording.hls = this.getHLSRecording(notification);
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private convertHls(hlsNotification?: HLSNotification, variants?: HLSVariant[]) {
    const hls: HMSHLS = {
      running: !!hlsNotification?.enabled,
      variants: [],
      error: this.toSdkError(hlsNotification?.error),
    };
    hlsNotification?.variants?.forEach((variant, index) => {
      const initialisedAt = variants?.[index].initialisedAt;
      hls.variants.push({
        meetingURL: variant.meeting_url,
        url: variant.url,
        metadata: variant.metadata,
        startedAt: convertDateNumToDate(variant.started_at),
        initialisedAt,
      });
    });

    return hls;
  }

  private getHLSRecording(hlsNotification?: HLSNotification): HMSHLSRecording {
    let hlsRecording: HMSHLSRecording = { running: false };
    if (hlsNotification?.hls_recording) {
      hlsRecording = {
        running: !!hlsNotification?.enabled,
        singleFilePerLayer: !!hlsNotification.hls_recording?.single_file_per_layer,
        hlsVod: !!hlsNotification.hls_recording?.hls_vod,
        startedAt: convertDateNumToDate(hlsNotification?.variants?.[0].started_at),
        error: this.toSdkError(hlsNotification.error),
      };
    }
    return hlsRecording;
  }

  private getPeerListHLSRecording(recording?: RoomState['recording']): HMSHLSRecording {
    const hlsNotification = recording?.hls;
    return {
      running: !!hlsNotification?.enabled,
      startedAt: convertDateNumToDate(hlsNotification?.started_at),
      singleFilePerLayer: !!hlsNotification?.config?.single_file_per_layer,
      hlsVod: !!hlsNotification?.config?.hls_vod,
    };
  }

  private setRecordingStatus(running: boolean, notification: RecordingNotification) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, `set recording status running=${running} - room not present`);
      return;
    }

    let action: HMSRoomUpdate;
    if (notification.type === 'sfu') {
      room.recording.server = {
        running,
        startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
        error: this.toSdkError(notification.error),
      };
      action = HMSRoomUpdate.SERVER_RECORDING_STATE_UPDATED;
    } else {
      room.recording.browser = {
        running,
        startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
        error: this.toSdkError(notification.error),
      };
      action = HMSRoomUpdate.BROWSER_RECORDING_STATE_UPDATED;
    }
    this.listener?.onRoomUpdate(action, room);
  }

  private setRTMPStatus(running: boolean, notification: RTMPNotification) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on policy change - room not present');
      return;
    }

    room.rtmp = {
      running,
      startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
      error: this.toSdkError(notification.error),
    };
    this.listener?.onRoomUpdate(HMSRoomUpdate.RTMP_STREAMING_STATE_UPDATED, room);
  }

  private toSdkError(error?: ServerError): HMSException | undefined {
    if (!error?.code) {
      return undefined;
    }
    const errMsg = error.message || 'error in streaming/recording';
    const sdkError = new HMSException(error.code, 'ServerErrors', HMSAction.NONE, errMsg, errMsg);
    HMSLogger.e(this.TAG, 'error in streaming/recording', sdkError);
    return sdkError;
  }
}
