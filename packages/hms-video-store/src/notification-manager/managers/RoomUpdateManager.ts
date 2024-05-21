import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
import {
  HLSVariant,
  HMSBrowserRecording,
  HMSHLS,
  HMSHLSRecording,
  HMSRoomUpdate,
  HMSSFURecording,
  HMSTranscriptionInfo,
  HMSUpdateListener,
} from '../../interfaces';
import { ServerError } from '../../interfaces/internal';
import { Store } from '../../sdk/store';
import { convertDateNumToDate } from '../../utils/date';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import {
  HLSNotification,
  HMSRecordingState,
  HMSStreamingState,
  PeerListNotification,
  PeriodicRoomState,
  RecordingNotification,
  RecordingNotificationType,
  RoomInfo,
  RoomState,
  RTMPNotification,
  SessionInfo,
  TranscriptionNotification,
} from '../HMSNotifications';

export class RoomUpdateManager {
  private readonly TAG = '[RoomUpdateManager]';

  constructor(private store: Store, public listener?: HMSUpdateListener) {}

  // eslint-disable-next-line complexity
  handleNotification(method: HMSNotificationMethod, notification: any) {
    switch (method) {
      case HMSNotificationMethod.PEER_LIST:
        this.onRoomState((notification as PeerListNotification).room);
        break;
      case HMSNotificationMethod.RTMP_UPDATE:
        this.updateRTMPStatus(notification as RTMPNotification);
        break;
      case HMSNotificationMethod.RECORDING_UPDATE:
        this.updateRecordingStatus(notification as RecordingNotification);
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
      case HMSNotificationMethod.HLS_UPDATE:
        this.updateHLSStatus(notification as HLSNotification);
        break;
      case HMSNotificationMethod.TRANSCRIPTION_UPDATE:
        this.handleTranscriptionStatus([notification as TranscriptionNotification]);
        break;
      default:
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
    const { recording, streaming, transcriptions, session_id, started_at, name } = roomNotification;
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on room state - room not present');
      return;
    }

    room.name = name;

    room.rtmp.running = this.isStreamingRunning(streaming?.rtmp?.state);
    room.rtmp.startedAt = convertDateNumToDate(streaming?.rtmp?.started_at);
    room.rtmp.state = streaming?.rtmp?.state;

    room.recording.server = this.getPeerListSFURecording(recording);
    room.recording.browser = this.getPeerListBrowserRecording(recording);
    room.recording.hls = this.getPeerListHLSRecording(recording);

    room.hls = this.convertHls(streaming?.hls);

    room.transcriptions = this.addTranscriptionDetail(transcriptions);

    room.sessionId = session_id;
    room.startedAt = convertDateNumToDate(started_at);
    this.listener?.onRoomUpdate(HMSRoomUpdate.RECORDING_STATE_UPDATED, room);
  }

  private addTranscriptionDetail(transcriptions?: TranscriptionNotification[]): HMSTranscriptionInfo[] {
    if (!transcriptions) {
      return [];
    }
    return transcriptions.map((transcription: TranscriptionNotification) => {
      return {
        state: transcription.state,
        mode: transcription.mode,
        initialised_at: convertDateNumToDate(transcription.initialised_at),
        started_at: convertDateNumToDate(transcription.started_at),
        stopped_at: convertDateNumToDate(transcription.stopped_at),
        updated_at: convertDateNumToDate(transcription.updated_at),
        error: this.toSdkError(transcription?.error),
      };
    });
  }
  private isRecordingRunning(state?: HMSRecordingState): boolean {
    if (!state) {
      return false;
    }
    return ![
      HMSRecordingState.NONE,
      HMSRecordingState.PAUSED,
      HMSRecordingState.STOPPED,
      HMSRecordingState.FAILED,
    ].includes(state);
  }

  private isStreamingRunning(state?: HMSStreamingState): boolean {
    if (!state) {
      return false;
    }
    return ![HMSStreamingState.NONE, HMSStreamingState.STOPPED, HMSStreamingState.FAILED].includes(state);
  }

  private initHLS(notification?: HLSNotification): HMSHLS {
    const room = this.store.getRoom();
    const hls: HMSHLS = {
      running: true,
      variants: [],
    };
    if (!room) {
      HMSLogger.w(this.TAG, 'on hls - room not present');
      return hls;
    }
    if (!notification?.variants) {
      return hls;
    }
    notification.variants.forEach((variant: HLSVariant, index: number) => {
      if (variant.state !== HMSStreamingState.INITIALISED) {
        hls.variants.push({
          meetingURL: variant?.meetingURL,
          url: variant?.url,
          metadata: variant?.metadata,
          playlist_type: variant?.playlist_type,
          startedAt: convertDateNumToDate(notification?.variants?.[index].started_at),
          initialisedAt: convertDateNumToDate(notification?.variants?.[index].initialised_at),
          state: variant.state,
          stream_type: variant?.stream_type,
        });
      } else {
        hls.variants.push({
          initialisedAt: convertDateNumToDate(notification?.variants?.[index].initialised_at),
          url: '',
        });
      }
    });
    return hls;
  }
  private updateHLSStatus(notification: HLSNotification) {
    const room = this.store.getRoom();
    const running =
      notification.variants && notification.variants.length > 0
        ? notification.variants.some(variant => this.isStreamingRunning(variant.state))
        : false;
    if (!room) {
      HMSLogger.w(this.TAG, 'on hls - room not present');
      return;
    }
    notification.enabled = running;
    room.hls = this.convertHls(notification);
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private handleTranscriptionStatus(notification: TranscriptionNotification[]) {
    const room = this.store.getRoom();
    if (!room) {
      HMSLogger.w(this.TAG, 'on transcription - room not present');
      return;
    }
    room.transcriptions = this.addTranscriptionDetail(notification) || [];
    this.listener?.onRoomUpdate(HMSRoomUpdate.TRANSCRIPTION_STATE_UPDATED, room);
  }
  private convertHls(hlsNotification?: HLSNotification) {
    // only checking for zeroth variant intialized
    const isInitialised =
      hlsNotification?.variants && hlsNotification.variants.length > 0
        ? hlsNotification.variants.some(variant => variant.state === HMSStreamingState.INITIALISED)
        : false;
    // handling for initialized state
    if (isInitialised) {
      return this.initHLS(hlsNotification);
    }
    const hls: HMSHLS = {
      running: !!hlsNotification?.enabled,
      variants: [],
      error: this.toSdkError(hlsNotification?.error),
    };
    hlsNotification?.variants?.forEach(variant => {
      hls.variants.push({
        meetingURL: variant?.meeting_url,
        url: variant?.url,
        metadata: variant?.metadata,
        playlist_type: variant?.playlist_type,
        startedAt: convertDateNumToDate(variant?.started_at),
        initialisedAt: convertDateNumToDate(variant?.initialised_at),
        state: variant.state,
        stream_type: variant?.stream_type,
      });
    });
    return hls;
  }

  private getHLSRecording(hlsNotification?: RecordingNotification): HMSHLSRecording {
    let hlsRecording: HMSHLSRecording = { running: false };
    const running = this.isRecordingRunning(hlsNotification?.state);
    if (running || hlsNotification?.state === HMSRecordingState.PAUSED) {
      hlsRecording = {
        running,
        singleFilePerLayer: !!hlsNotification?.hls_recording?.single_file_per_layer,
        hlsVod: !!hlsNotification?.hls_recording?.hls_vod,
        startedAt: convertDateNumToDate(hlsNotification?.started_at),
        initialisedAt: convertDateNumToDate(hlsNotification?.initialised_at),
        state: hlsNotification?.state,
        error: this.toSdkError(hlsNotification?.error),
      };
    }
    return hlsRecording;
  }

  private getPeerListHLSRecording(recording?: RoomState['recording']): HMSHLSRecording {
    const hlsNotification = recording?.hls;
    const running = this.isRecordingRunning(hlsNotification?.state);
    return {
      running,
      startedAt: convertDateNumToDate(hlsNotification?.started_at),
      initialisedAt: convertDateNumToDate(hlsNotification?.initialised_at),
      state: hlsNotification?.state,
      singleFilePerLayer: hlsNotification?.config?.single_file_per_layer,
      hlsVod: hlsNotification?.config?.hls_vod,
    };
  }
  private getPeerListBrowserRecording(recording?: RoomState['recording']): HMSBrowserRecording {
    const browserNotification = recording?.browser;
    const running = this.isRecordingRunning(browserNotification?.state);
    return {
      running,
      startedAt: convertDateNumToDate(browserNotification?.started_at),
      state: browserNotification?.state,
    };
  }
  private getPeerListSFURecording(recording?: RoomState['recording']): HMSSFURecording {
    const sfuNotification = recording?.sfu;
    const running = this.isRecordingRunning(sfuNotification?.state);
    return {
      running,
      startedAt: convertDateNumToDate(sfuNotification?.started_at),
      state: sfuNotification?.state,
    };
  }

  private updateRecordingStatus(notification: RecordingNotification) {
    const room = this.store.getRoom();
    const running = this.isRecordingRunning(notification.state);
    if (!room) {
      HMSLogger.w(this.TAG, `set recording status running=${running} - room not present`);
      return;
    }

    let action: HMSRoomUpdate;
    if (notification.type === RecordingNotificationType.SFU) {
      room.recording.server = {
        running,
        startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
        error: this.toSdkError(notification.error),
        state: notification.state,
      };
      action = HMSRoomUpdate.SERVER_RECORDING_STATE_UPDATED;
    } else if (notification.type === RecordingNotificationType.HLS) {
      room.recording.hls = this.getHLSRecording(notification);
      action = HMSRoomUpdate.RECORDING_STATE_UPDATED;
    } else {
      room.recording.browser = {
        running,
        startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
        error: this.toSdkError(notification.error),
        state: notification?.state,
      };
      action = HMSRoomUpdate.BROWSER_RECORDING_STATE_UPDATED;
    }
    this.listener?.onRoomUpdate(action, room);
  }

  private updateRTMPStatus(notification: RTMPNotification) {
    const room = this.store.getRoom();
    const running = this.isStreamingRunning(notification.state);
    if (!room) {
      HMSLogger.w(this.TAG, 'on policy change - room not present');
      return;
    }
    if (!running) {
      room.rtmp = {
        running,
        state: notification.state,
        error: this.toSdkError(notification.error),
      };
      this.listener?.onRoomUpdate(HMSRoomUpdate.RTMP_STREAMING_STATE_UPDATED, room);
      return;
    }
    room.rtmp = {
      running,
      startedAt: running ? convertDateNumToDate(notification.started_at) : undefined,
      state: notification.state,
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
