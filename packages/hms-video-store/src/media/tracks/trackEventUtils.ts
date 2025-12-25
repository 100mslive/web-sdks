import { HMSTrackType } from './HMSTrackType';
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';
import { listenToPermissionChange } from '../../utils/track';

export type PermissionType = 'microphone' | 'camera';
export type TrackEventType = 'audio' | 'video';

/**
 * Common track event handler patterns shared between local audio and video tracks
 */
export class TrackEventHandler {
  constructor(private eventBus: EventBus, private trackType: HMSTrackType) {}

  /**
   * Handle native track mute events with analytics
   */
  handleNativeTrackMute(): void {
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';
    this.eventBus.analytics.publish(
      this.createInterruptionEvent({
        started: true,
        reason,
      }),
    );
  }

  /**
   * Handle native track unmute events with analytics
   */
  handleNativeTrackUnmute(): void {
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';
    this.eventBus.analytics.publish(
      this.createInterruptionEvent({
        started: false,
        reason,
      }),
    );
  }

  /**
   * Create interruption analytics event
   */
  private createInterruptionEvent({ started, reason }: { started: boolean; reason: string }) {
    return AnalyticsEventFactory.interruption({
      started,
      type: this.trackType,
      reason,
      deviceInfo: {
        deviceId: undefined, // To be filled by caller with actual device info
        groupId: undefined,
      },
    });
  }

  /**
   * Setup permission tracking with analytics
   */
  setupPermissionTracking(
    permissionType: PermissionType,
    onPermissionDenied: () => void,
    onPermissionChange: (state: PermissionState) => void,
  ): void {
    listenToPermissionChange(permissionType, (state: PermissionState) => {
      onPermissionChange(state);
      this.eventBus.analytics.publish(AnalyticsEventFactory.permissionChange(this.trackType, state));
      if (state === 'denied') {
        onPermissionDenied();
      }
    });
  }

  /**
   * Handle visibility change events for tracks
   */
  async handleVisibilityChange(
    shouldReacquireTrack: () => boolean,
    isEnabled: boolean,
    permissionState: PermissionState | undefined,
    onBackgroundAction: () => Promise<void>,
    onForegroundAction: () => Promise<void>,
  ): Promise<void> {
    if (document.visibilityState === 'hidden') {
      await this.handleHiddenState(isEnabled, onBackgroundAction);
    } else {
      await this.handleVisibleState(shouldReacquireTrack, permissionState, onForegroundAction);
    }
  }

  private async handleHiddenState(isEnabled: boolean, onBackgroundAction: () => Promise<void>): Promise<void> {
    this.handleNativeTrackMute();
    if (isEnabled) {
      await onBackgroundAction();
    }
  }

  private async handleVisibleState(
    shouldReacquireTrack: () => boolean,
    permissionState: PermissionState | undefined,
    onForegroundAction: () => Promise<void>,
  ): Promise<void> {
    this.handleNativeTrackUnmute();
    if (permissionState && permissionState !== 'granted') {
      return;
    }
    if (shouldReacquireTrack()) {
      try {
        await onForegroundAction();
      } catch (error) {
        this.eventBus.error.publish(error as HMSException);
      }
    }
  }

  /**
   * Add event listeners to a MediaStreamTrack
   */
  addTrackEventListeners(track: MediaStreamTrack, onMute: () => void, onUnmute: () => Promise<void>): void {
    track.addEventListener('mute', onMute);
    track.addEventListener('unmute', onUnmute);
  }

  /**
   * Remove event listeners from a MediaStreamTrack
   */
  removeTrackEventListeners(track: MediaStreamTrack, onMute: () => void, onUnmute: () => Promise<void>): void {
    track.removeEventListener('mute', onMute);
    track.removeEventListener('unmute', onUnmute);
  }
}
