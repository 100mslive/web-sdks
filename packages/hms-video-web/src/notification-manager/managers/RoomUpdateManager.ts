/* eslint-disable complexity */
import {
  RecordingNotification,
  PeerListNotification,
  HLSNotification,
  RTMPNotification,
  PeriodicRoomState,
  RoomState,
} from '../HMSNotifications';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { HMSUpdateListener, HMSRoomUpdate, HMSHLS } from '../../interfaces';
import { IStore } from '../../sdk/store';

export class RoomUpdateManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

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
      default:
        this.onHLS(method, notification as HLSNotification);
        break;
    }
  }

  private handlePreviewRoomState(notification: PeriodicRoomState) {
    const { room } = notification;
    this.onRoomState(room, notification.peer_count);
  }

  private onRoomState(roomNotification: RoomState, peerCount?: number) {
    const { recording, streaming, session_id, started_at, name } = roomNotification;
    const room = this.store.getRoom();
    room.peerCount = peerCount;
    room.name = name;
    room.recording.server.running = recording.sfu.enabled;
    room.recording.browser.running = recording.browser.enabled;
    room.rtmp.running = streaming.rtmp?.enabled || streaming.enabled;
    room.rtmp.startedAt = this.getAsDate(streaming.rtmp?.started_at);
    room.recording.server.startedAt = this.getAsDate(recording.sfu.started_at);
    room.recording.browser.startedAt = this.getAsDate(recording.browser.started_at);
    room.hls = this.convertHls(streaming.hls);
    room.sessionId = session_id;
    room.startedAt = this.getAsDate(started_at);
    this.listener?.onRoomUpdate(HMSRoomUpdate.RECORDING_STATE_UPDATED, room);
  }

  private getAsDate(dateNum?: number): Date | undefined {
    return dateNum ? new Date(dateNum) : undefined;
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

  private onHLS(method: string, notification: HLSNotification) {
    if (![HMSNotificationMethod.HLS_START, HMSNotificationMethod.HLS_STOP].includes(method as HMSNotificationMethod)) {
      return;
    }
    const room = this.store.getRoom();
    notification.enabled = method === HMSNotificationMethod.HLS_START && !notification.error?.code;
    room.hls = this.convertHls(notification);
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private convertHls(hlsNotification: HLSNotification) {
    const hls: HMSHLS = {
      running: hlsNotification.enabled,
      variants: [],
      error: hlsNotification.error?.code ? hlsNotification.error : undefined,
    };
    hlsNotification?.variants?.map(variant => {
      hls?.variants.push({
        meetingURL: variant.meeting_url,
        url: variant.url,
        metadata: variant.metadata,
        startedAt: this.getAsDate(variant.started_at),
      });
    });
    return hls;
  }

  private setRecordingStatus(running: boolean, notification: RecordingNotification) {
    const room = this.store.getRoom();
    let action: number;
    if (notification.type === 'sfu') {
      room.recording.server = {
        running,
        startedAt: running ? this.getAsDate(notification.started_at) : undefined,
        error: notification.error?.code ? notification.error : undefined,
      };
      action = HMSRoomUpdate.SERVER_RECORDING_STATE_UPDATED;
    } else {
      room.recording.browser = {
        running,
        startedAt: running ? this.getAsDate(notification.started_at) : undefined,
        error: notification.error?.code ? notification.error : undefined,
      };
      action = HMSRoomUpdate.BROWSER_RECORDING_STATE_UPDATED;
    }
    this.listener?.onRoomUpdate(action, room);
  }

  private setRTMPStatus(running: boolean, notification: RTMPNotification) {
    const room = this.store.getRoom();
    room.rtmp = {
      running,
      startedAt: running ? this.getAsDate(notification.started_at) : undefined,
      error: notification.error?.code ? notification.error : undefined,
    };
    this.listener?.onRoomUpdate(HMSRoomUpdate.RTMP_STREAMING_STATE_UPDATED, room);
  }
}
