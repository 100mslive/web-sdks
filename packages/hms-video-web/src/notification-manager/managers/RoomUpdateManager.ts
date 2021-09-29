import { RecordingNotification, PeerListNotification } from '../HMSNotifications';
import { HMSUpdateListener, HMSRoomUpdate } from '../../interfaces';
import { IStore } from '../../sdk/store';

export class RoomUpdateManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

  onPeerList(notification: PeerListNotification) {
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

  onRTMPStart() {
    this.setRTMPStatus(true);
  }

  onRTMPStop() {
    this.setRTMPStatus(false);
  }

  onRecordingStart(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, true);
  }

  onRecordingStop(notification: RecordingNotification) {
    this.setRecordingStatus(notification.type, false);
  }

  private setRecordingStatus(type: 'sfu' | 'Browser', running: boolean) {
    const room = this.store.getRoom();
    if (!room.recording) {
      room.recording = this.getDefaultRecordingState();
    }
    let action: number = -1;
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
