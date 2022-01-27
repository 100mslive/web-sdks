/* eslint-disable complexity */
import {
  RecordingNotification,
  PeerListNotification,
  HLSNotification,
  RTMPNotification,
  PeriodicRoomState,
  SessionState,
} from '../HMSNotifications';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { HMSUpdateListener, HMSRoomUpdate, HMSHLS } from '../../interfaces';
import { IStore } from '../../sdk/store';

export class RoomUpdateManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

  handleNotification(method: HMSNotificationMethod, notification: any) {
    switch (method) {
      case HMSNotificationMethod.PEER_LIST:
        this.onPeerList((notification as PeerListNotification).room);
        break;
      case HMSNotificationMethod.RTMP_START:
        this.onRTMPStart(notification as RTMPNotification);
        break;
      case HMSNotificationMethod.RTMP_STOP:
        this.onRTMPStop();
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
    const { session, room } = notification;
    session.name = room.name;
    this.onPeerList(session);
  }

  private onPeerList(roomNotification: SessionState) {
    const { recording, streaming, session_id, started_at, name } = roomNotification;
    const room = this.store.getRoom();
    room.name = name;
    if (!room.recording) {
      room.recording = this.getDefaultRecordingState();
    }
    if (!room.rtmp) {
      room.rtmp = {
        running: false,
      };
    }
    room.recording.server.running = recording.sfu.enabled;
    room.recording.browser.running = recording.beam.enabled;
    room.rtmp.running = streaming.rtmp?.enabled || streaming.enabled;
    room.rtmp.startedAt = this.getAsDate(streaming.rtmp?.started_at);
    room.recording.server.startedAt = this.getAsDate(recording.sfu.started_at);
    room.recording.browser.startedAt = this.getAsDate(recording.beam.started_at);
    room.hls = this.convertHls(streaming.hls);
    room.sessionId = session_id;
    room.startedAt = this.getAsDate(started_at);
    this.listener?.onRoomUpdate(HMSRoomUpdate.RECORDING_STATE_UPDATED, room);
  }

  private getAsDate(dateNum?: number): Date | undefined {
    return dateNum ? new Date(dateNum) : undefined;
  }

  private onRTMPStart(notification: RTMPNotification) {
    this.setRTMPStatus(true, notification.started_at);
  }

  private onRTMPStop() {
    this.setRTMPStatus(false);
  }

  private onRecordingStart(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, true, notification.started_at);
  }

  private onRecordingStop(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, false);
  }

  private onHLS(method: string, notification: HLSNotification) {
    if (![HMSNotificationMethod.HLS_START, HMSNotificationMethod.HLS_STOP].includes(method as HMSNotificationMethod)) {
      return;
    }
    const room = this.store.getRoom();
    notification.enabled = method === HMSNotificationMethod.HLS_START;
    room.hls = this.convertHls(notification);
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private convertHls(hlsNotification: HLSNotification) {
    const hls: HMSHLS = { running: hlsNotification.enabled, variants: [] };
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

  private setRecordingStatus(type: 'sfu' | 'Browser', running: boolean, startedAt?: number) {
    const room = this.store.getRoom();
    if (!room.recording) {
      room.recording = this.getDefaultRecordingState();
    }
    let action = -1;
    if (type === 'sfu') {
      room.recording.server.running = running;
      room.recording.server.startedAt = this.getAsDate(startedAt);
      action = HMSRoomUpdate.SERVER_RECORDING_STATE_UPDATED;
    } else {
      room.recording.browser.running = running;
      action = HMSRoomUpdate.BROWSER_RECORDING_STATE_UPDATED;
    }
    this.listener?.onRoomUpdate(action, room);
  }

  private setRTMPStatus(running: boolean, startedAt?: number) {
    const room = this.store.getRoom();
    if (!room.rtmp) {
      room.rtmp = {
        running: false,
        startedAt: this.getAsDate(startedAt),
      };
    }
    room.rtmp.running = running;
    this.listener?.onRoomUpdate(HMSRoomUpdate.RTMP_STREAMING_STATE_UPDATED, room);
  }

  private getDefaultRecordingState() {
    return {
      browser: {
        running: false,
      },
      server: {
        running: false,
      },
    };
  }
}
