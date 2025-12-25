import { HMSTrack, HMSTrackSource } from './HMSTrack';
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';
import Room from '../../sdk/models/HMSRoom';
import { listenToPermissionChange } from '../../utils/track';
import { HMSLocalStream } from '../streams';

export type LocalTrackPermissionType = 'microphone' | 'camera';

export interface LocalTrackSettings {
  deviceId?: string;
  [key: string]: any;
}

export interface DeviceChangeInfo {
  isUserSelection: boolean;
  type: 'video' | 'audioOutput' | 'audioInput';
  selection: {
    deviceId: string;
    groupId?: string;
  };
}

/**
 * Base class for local tracks (audio and video) that handles common functionality
 * like event listeners, permission tracking, device management, and analytics
 */
export abstract class HMSLocalTrack<T extends LocalTrackSettings> extends HMSTrack {
  protected settings: T;
  protected permissionState?: PermissionState;
  protected isPublished = false;
  protected publishedTrackId?: string;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    protected eventBus: EventBus,
    settings: T,
    protected room?: Room,
  ) {
    super(stream, track, source as HMSTrackSource);
    this.settings = settings;
    this.addTrackEventListeners(track);
    this.trackPermissions();
    this.setFirstTrackId(track.id);
  }

  /**
   * Verify if the track id being passed is of this track for correlating server messages
   */
  isPublishedTrackId(trackId: string): boolean {
    return this.publishedTrackId === trackId;
  }

  /**
   * Get the current settings for this track
   */
  getSettings(): T {
    return { ...this.settings };
  }

  /**
   * Add event listeners to a MediaStreamTrack
   */
  protected addTrackEventListeners(track: MediaStreamTrack): void {
    track.addEventListener('mute', this.handleTrackMute);
    track.addEventListener('unmute', this.handleTrackUnmute);
  }

  /**
   * Remove event listeners from a MediaStreamTrack
   */
  protected removeTrackEventListeners(track: MediaStreamTrack): void {
    track.removeEventListener('mute', this.handleTrackMute);
    track.removeEventListener('unmute', this.handleTrackUnmute);
  }

  /**
   * Set up permission tracking for the track's permission type
   */
  protected trackPermissions(): void {
    const permissionType = this.getPermissionType();
    listenToPermissionChange(permissionType, (state: PermissionState) => {
      this.permissionState = state;
      this.eventBus.analytics.publish(AnalyticsEventFactory.permissionChange(this.type, state));
      if (state === 'denied') {
        this.handlePermissionDenied();
      }
    });
  }

  /**
   * Handle native track mute events
   */
  protected handleTrackMute = (): void => {
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';
    this.eventBus.analytics.publish(
      this.sendInterruptionEvent({
        started: true,
        reason,
      }),
    );
    this.handleTrackStateChange(false);
  };

  /**
   * Handle native track unmute events
   */
  protected handleTrackUnmute = async (): Promise<void> => {
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';
    this.eventBus.analytics.publish(
      this.sendInterruptionEvent({
        started: false,
        reason,
      }),
    );
    try {
      await this.handleNativeUnmute();
    } catch (error) {
      this.eventBus.error.publish(error as HMSException);
    }
  };

  /**
   * Handle device changes and publish appropriate events
   */
  protected handleDeviceChangeEvent(deviceInfo: DeviceChangeInfo): void {
    if (deviceInfo.isUserSelection && deviceInfo.selection.deviceId) {
      DeviceStorageManager.updateSelection(this.getDeviceStorageType() as any, {
        deviceId: deviceInfo.selection.deviceId,
        groupId: deviceInfo.selection.groupId,
      });
      this.eventBus.deviceChange.publish(deviceInfo);
    }
  }

  /**
   * Send analytics event when track fails to publish
   */
  protected sendPublishFailedEvent(error: Error): void {
    if (this.isPublished) {
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.publish({
          error,
        }),
      );
    }
  }

  /**
   * Build new settings by merging current settings with partial updates
   */
  protected abstract buildNewSettings(settings: Partial<T>): T;

  /**
   * Get the permission type for this track (microphone/camera)
   */
  protected abstract getPermissionType(): LocalTrackPermissionType;

  /**
   * Get the device storage type for this track
   */
  protected abstract getDeviceStorageType(): string;

  /**
   * Handle track state changes (enabled/disabled)
   */
  protected abstract handleTrackStateChange(enabled: boolean): void;

  /**
   * Handle permission denied scenarios
   */
  protected abstract handlePermissionDenied(): void;

  /**
   * Handle native track unmute logic specific to each track type
   */
  protected abstract handleNativeUnmute(): Promise<void>;

  /**
   * Clean up local track resources
   */
  cleanup(): void {
    super.cleanup();
    this.removeTrackEventListeners(this.nativeTrack);
    this.isPublished = false;
  }
}
