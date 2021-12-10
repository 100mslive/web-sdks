import { RecordingNotification, PeerListNotification, HLSNotification } from '../HMSNotifications';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { HMSUpdateListener, HMSRoomUpdate } from '../../interfaces';
import { IStore } from '../../sdk/store';

export class RoomUpdateManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

  handleNotification(method: HMSNotificationMethod, notification: any) {
    switch (method) {
      case HMSNotificationMethod.PEER_LIST:
        this.onPeerList(notification as PeerListNotification);
        break;
      case HMSNotificationMethod.RTMP_START:
        this.onRTMPStart();
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
      default:
        this.onHLS(method, notification as HLSNotification);
        break;
    }
  }

  private onPeerList(notification: PeerListNotification) {
    const { recording, streaming } = notification.room;
    const room = this.store.getRoom();
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
    room.rtmp.running = streaming.enabled;
    this.listener?.onRoomUpdate(HMSRoomUpdate.RECORDING_STATE_UPDATED, room);
  }

  private onRTMPStart() {
    this.setRTMPStatus(true);
  }

  private onRTMPStop() {
    this.setRTMPStatus(false);
  }

  private onRecordingStart(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, true);
  }

  private onRecordingStop(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, false);
  }

  private onHLS(method: string, notification: HLSNotification) {
    if (![HMSNotificationMethod.HLS_START, HMSNotificationMethod.HLS_STOP].includes(method as HMSNotificationMethod)) {
      return;
    }
    const room = this.store.getRoom();
    if (!room.hls) {
      room.hls = {
        running: false,
        url: '',
      };
    }
    if (method === HMSNotificationMethod.HLS_START) {
      room.hls.running = true;
      room.hls.url = notification.url!;
    } else {
      room.hls.running = false;
      room.hls.url = '';
    }
    this.listener?.onRoomUpdate(HMSRoomUpdate.HLS_STREAMING_STATE_UPDATED, room);
  }

  private setRecordingStatus(type: 'sfu' | 'Browser', running: boolean) {
    const room = this.store.getRoom();
    if (!room.recording) {
      room.recording = this.getDefaultRecordingState();
    }
    let action = -1;
    if (type === 'sfu') {
      room.recording.server.running = running;
      action = HMSRoomUpdate.SERVER_RECORDING_STATE_UPDATED;
    } else {
      room.recording.browser.running = running;
      action = HMSRoomUpdate.BROWSER_RECORDING_STATE_UPDATED;
    }
    this.listener?.onRoomUpdate(action, room);
  }

  private setRTMPStatus(running: boolean) {
    const room = this.store.getRoom();
    if (!room.rtmp) {
      room.rtmp = {
        running: false,
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
