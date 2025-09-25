import { ErrorFactory } from '../../../../error/ErrorFactory';
import { HMSAction } from '../../../../error/HMSAction';
import HMSLogger from '../../../../utils/logger';
import { getAudioTrack, getVideoTrack } from '../../../../utils/track';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../../../settings';

/**
 * Shared service implementations for track state machines
 * These services encapsulate common async operations to reduce code duplication
 */

export interface TrackServiceContext {
  nativeTrack?: MediaStreamTrack;
  processedTrack?: MediaStreamTrack;
  settings?: HMSAudioTrackSettings | HMSVideoTrackSettings;
  deviceId?: string;
  enabled: boolean;
  isPublished: boolean;
}

export class TrackServices {
  private static TAG = '[TrackServices]';

  /**
   * Service to acquire an audio track with given settings
   */
  static async acquireAudioTrack(settings: HMSAudioTrackSettings): Promise<MediaStreamTrack> {
    try {
      HMSLogger.d(TrackServices.TAG, 'Acquiring audio track', settings);
      return await getAudioTrack(settings);
    } catch (error) {
      HMSLogger.e(TrackServices.TAG, 'Failed to acquire audio track', error);
      throw ErrorFactory.TracksErrors.AudioTrackSettingsError(
        HMSAction.TRACK,
        `Failed to acquire audio track: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Service to acquire a video track with given settings
   */
  static async acquireVideoTrack(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
    try {
      HMSLogger.d(TrackServices.TAG, 'Acquiring video track', settings);
      return await getVideoTrack(settings);
    } catch (error) {
      HMSLogger.e(TrackServices.TAG, 'Failed to acquire video track', error);
      throw ErrorFactory.TracksErrors.VideoTrackSettingsError(
        HMSAction.TRACK,
        `Failed to acquire video track: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Service to replace track on transceiver
   */
  static async replaceTrackOnTransceiver(
    transceiver: RTCRtpTransceiver | undefined,
    newTrack: MediaStreamTrack | null,
    processedTrack?: MediaStreamTrack,
  ): Promise<void> {
    if (!transceiver?.sender) {
      return;
    }

    try {
      const trackToSend = processedTrack || newTrack;
      HMSLogger.d(TrackServices.TAG, 'Replacing track on transceiver', trackToSend?.id);
      await transceiver.sender.replaceTrack(trackToSend);
    } catch (error) {
      HMSLogger.e(TrackServices.TAG, 'Failed to replace track on transceiver', error);
      throw error;
    }
  }

  /**
   * Service to enable a track
   */
  static async enableTrack(context: TrackServiceContext): Promise<void> {
    if (!context.nativeTrack) {
      throw new Error('No native track available to enable');
    }

    context.nativeTrack.enabled = true;

    // If published, ensure transceiver has the right track
    if (context.isPublished) {
      HMSLogger.d(TrackServices.TAG, 'Track is published, updating transceiver');
    }
  }

  /**
   * Service to disable a track
   */
  static async disableTrack(context: TrackServiceContext): Promise<void> {
    if (!context.nativeTrack) {
      return;
    }

    context.nativeTrack.enabled = false;
  }

  /**
   * Service to handle device change
   */
  static async changeDevice(
    context: TrackServiceContext,
    deviceId: string,
    type: 'audio' | 'video',
  ): Promise<MediaStreamTrack> {
    if (type === 'audio' && context.settings instanceof HMSAudioTrackSettings) {
      const newSettings = new HMSAudioTrackSettings({ ...context.settings, deviceId });
      return await TrackServices.acquireAudioTrack(newSettings);
    } else if (type === 'video' && context.settings instanceof HMSVideoTrackSettings) {
      const newSettings = new HMSVideoTrackSettings({ ...context.settings, deviceId });
      return await TrackServices.acquireVideoTrack(newSettings);
    } else {
      throw new Error('Invalid settings type for device change');
    }
  }

  /**
   * Service to handle track interruption recovery
   */
  static async recoverFromInterruption(
    context: TrackServiceContext,
    type: 'audio' | 'video',
  ): Promise<MediaStreamTrack | null> {
    try {
      HMSLogger.d(TrackServices.TAG, 'Recovering from interruption');

      if (!context.settings) {
        return null;
      }

      if (type === 'audio') {
        if (context.settings instanceof HMSAudioTrackSettings) {
          return await TrackServices.acquireAudioTrack(context.settings);
        }
      } else if (type === 'video') {
        if (context.settings instanceof HMSVideoTrackSettings) {
          return await TrackServices.acquireVideoTrack(context.settings);
        }
      }

      return null;
    } catch (error) {
      HMSLogger.e(TrackServices.TAG, 'Failed to recover from interruption', error);
      return null;
    }
  }

  /**
   * Service to check permission status
   */
  static async checkPermission(type: 'microphone' | 'camera'): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: type as PermissionName });
      return result.state;
    } catch (error) {
      HMSLogger.w(TrackServices.TAG, 'Permission API not available');
      return 'prompt';
    }
  }

  /**
   * Service to stop and cleanup a track
   */
  static stopTrack(track: MediaStreamTrack | undefined): void {
    if (track) {
      try {
        track.stop();
        HMSLogger.d(TrackServices.TAG, 'Stopped track', track.id);
      } catch (error) {
        HMSLogger.e(TrackServices.TAG, 'Error stopping track', error);
      }
    }
  }

  /**
   * Service to validate track state
   */
  static isTrackValid(track: MediaStreamTrack | undefined): boolean {
    return track !== undefined && track.readyState === 'live' && !track.muted;
  }

  /**
   * Service to create a silent/blank track
   */
  static createSilentAudioTrack(): MediaStreamTrack {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const destination = audioContext.createMediaStreamDestination();

    oscillator.frequency.value = 0;
    oscillator.connect(destination);
    oscillator.start();

    return destination.stream.getAudioTracks()[0];
  }

  /**
   * Service to create a blank video track
   */
  static createBlankVideoTrack(width = 640, height = 480): MediaStreamTrack {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
    }

    const stream = canvas.captureStream(0);
    return stream.getVideoTracks()[0];
  }
}
