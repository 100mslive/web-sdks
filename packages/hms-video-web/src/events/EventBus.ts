import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSDeviceChangeEvent } from '../interfaces';
import { HMSEvents } from '../utils/constants';
import { HMSInternalEvent } from './HMSInternalEvent';
import { HMSRemoteVideoTrack } from '../media/tracks';
import { HMSWebrtcStats, RTCStatsUpdate } from '../rtc-stats';

export class EventBus {
  private eventEmitter: EventEmitter = new EventEmitter();
  readonly deviceChange = new HMSInternalEvent<HMSDeviceChangeEvent>(HMSEvents.DEVICE_CHANGE, this.eventEmitter);
  readonly localAudioEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_AUDIO_ENABLED, this.eventEmitter);
  readonly localVideoEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_VIDEO_ENABLED, this.eventEmitter);
  readonly statsUpdate = new HMSInternalEvent<HMSWebrtcStats>(HMSEvents.STATS_UPDATE, this.eventEmitter);
  readonly rtcStatsUpdate = new HMSInternalEvent<RTCStatsUpdate>(HMSEvents.RTC_STATS_UPDATE, this.eventEmitter);
  readonly trackDegraded = new HMSInternalEvent<HMSRemoteVideoTrack>(HMSEvents.TRACK_DEGRADED, this.eventEmitter);
  readonly trackRestored = new HMSInternalEvent<HMSRemoteVideoTrack>(HMSEvents.TRACK_RESTORED, this.eventEmitter);
}
