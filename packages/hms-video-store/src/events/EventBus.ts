import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSInternalEvent } from './HMSInternalEvent';
import AnalyticsEvent from '../analytics/AnalyticsEvent';
import { HMSException } from '../error/HMSException';
import { HMSDeviceChangeEvent, HMSRole } from '../interfaces';
import {
  HMSLocalAudioTrack,
  HMSLocalVideoTrack,
  HMSRemoteAudioTrack,
  HMSRemoteVideoTrack,
  HMSWebrtcStats,
} from '../internal';
import { PolicyParams } from '../notification-manager/HMSNotifications';
import { HMSRemotePeer } from '../sdk/models/peer';
import { HMSEvents } from '../utils/constants';
import { ITrackAudioLevelUpdate } from '../utils/track-audio-level-monitor';

export class EventBus {
  private eventEmitter: EventEmitter = new EventEmitter();
  readonly analytics: HMSInternalEvent<AnalyticsEvent> = new HMSInternalEvent<AnalyticsEvent>(
    HMSEvents.ANALYTICS,
    this.eventEmitter,
  );
  readonly deviceChange = new HMSInternalEvent<HMSDeviceChangeEvent>(HMSEvents.DEVICE_CHANGE, this.eventEmitter);
  readonly localAudioEnabled = new HMSInternalEvent<{ enabled: boolean; track: HMSLocalAudioTrack }>(
    HMSEvents.LOCAL_AUDIO_ENABLED,
    this.eventEmitter,
  );
  readonly localVideoEnabled = new HMSInternalEvent<{ enabled: boolean; track: HMSLocalVideoTrack }>(
    HMSEvents.LOCAL_VIDEO_ENABLED,
    this.eventEmitter,
  );
  readonly localVideoUnmutedNatively = new HMSInternalEvent(HMSEvents.LOCAL_VIDEO_UNMUTED_NATIVELY, this.eventEmitter);
  readonly localAudioUnmutedNatively = new HMSInternalEvent(HMSEvents.LOCAL_AUDIO_UNMUTED_NATIVELY, this.eventEmitter);

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

  readonly audioPluginFailed = new HMSInternalEvent<HMSException>(HMSEvents.AUDIO_PLUGIN_FAILED, this.eventEmitter);

  readonly localAudioSilence = new HMSInternalEvent<{ track: HMSLocalAudioTrack }>(
    HMSEvents.LOCAL_AUDIO_SILENCE,
    this.eventEmitter,
  );

  readonly policyChange = new HMSInternalEvent<PolicyParams>(HMSEvents.POLICY_CHANGE, this.eventEmitter);

  readonly localRoleUpdate = new HMSInternalEvent<{ oldRole: HMSRole; newRole: HMSRole }>(
    HMSEvents.LOCAL_ROLE_UPDATE,
    this.eventEmitter,
  );

  readonly audioTrackUpdate = new HMSInternalEvent<{ track: HMSRemoteAudioTrack; enabled: boolean }>(
    HMSEvents.AUDIO_TRACK_UPDATE,
    this.eventEmitter,
  );

  readonly audioTrackAdded = new HMSInternalEvent<{ track: HMSRemoteAudioTrack; peer: HMSRemotePeer }>(
    HMSEvents.AUDIO_TRACK_ADDED,
    this.eventEmitter,
  );

  readonly audioTrackRemoved = new HMSInternalEvent<HMSRemoteAudioTrack>(
    HMSEvents.AUDIO_TRACK_REMOVED,
    this.eventEmitter,
  );

  readonly autoplayError = new HMSInternalEvent<HMSException>(HMSEvents.AUTOPLAY_ERROR, this.eventEmitter);

  readonly leave = new HMSInternalEvent<HMSException | undefined>(HMSEvents.LEAVE, this.eventEmitter);

  readonly error = new HMSInternalEvent<HMSException>(HMSEvents.ERROR, this.eventEmitter);
}
