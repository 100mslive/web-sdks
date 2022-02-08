import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSDeviceChangeEvent } from '../interfaces';
import { HMSEvents } from '../utils/constants';
import { HMSInternalEvent } from './HMSInternalEvent';
import { HMSLocalAudioTrack, HMSRemoteVideoTrack } from '../media/tracks';
import { HMSWebrtcStats } from '../rtc-stats';
import { ITrackAudioLevelUpdate } from '../utils/track-audio-level-monitor';

export class EventBus {
  private eventEmitter: EventEmitter = new EventEmitter();
  readonly deviceChange = new HMSInternalEvent<HMSDeviceChangeEvent>(HMSEvents.DEVICE_CHANGE, this.eventEmitter);
  readonly localAudioEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_AUDIO_ENABLED, this.eventEmitter);
  readonly localVideoEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_VIDEO_ENABLED, this.eventEmitter);

  /**
   * Emitter which processes raw RTC stats from rtcStatsUpdate and calls client callback
   */
  readonly statsUpdate = new HMSInternalEvent<HMSWebrtcStats>(HMSEvents.STATS_UPDATE, this.eventEmitter);

  readonly trackDegraded = new HMSInternalEvent<HMSRemoteVideoTrack>(HMSEvents.TRACK_DEGRADED, this.eventEmitter);
  readonly trackRestored = new HMSInternalEvent<HMSRemoteVideoTrack>(HMSEvents.TRACK_RESTORED, this.eventEmitter);

  /**
   * Emits audio level updates for audio tracks(used with local track in preview)
   */
  readonly trackAudioLevelUpdate = new HMSInternalEvent<ITrackAudioLevelUpdate>(
    HMSEvents.TRACK_AUDIO_LEVEL_UPDATE,
    this.eventEmitter,
  );

  readonly localAudioSilence = new HMSInternalEvent<{ track: HMSLocalAudioTrack }>(
    HMSEvents.LOCAL_AUDIO_SILENCE,
    this.eventEmitter,
  );
}
