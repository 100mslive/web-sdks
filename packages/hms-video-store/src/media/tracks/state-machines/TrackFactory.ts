import { DeviceManager } from '../../../device-manager';
import { EventBus } from '../../../events/EventBus';
import { HMSTrackSource, HMSTrackType } from '../../../interfaces';
import { Store } from '../../../sdk/store';
import HMSLogger from '../../../utils/logger';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../../settings';
import { HMSLocalAudioTrackWithStateMachine } from '../HMSLocalAudioTrackWithStateMachine';

/**
 * Factory for creating tracks with state machine support
 * This centralizes track creation and reduces code duplication
 */
export class TrackFactory {
  private static TAG = '[TrackFactory]';

  /**
   * Create a local audio track with state machine
   */
  static createLocalAudioTrack(
    stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    settings: HMSAudioTrackSettings,
    eventBus: EventBus,
    deviceManager: DeviceManager,
    store: Store,
  ): HMSLocalAudioTrackWithStateMachine {
    HMSLogger.d(TrackFactory.TAG, 'Creating local audio track with state machine', {
      trackId: track.id,
      source,
      deviceId: settings.deviceId,
    });

    return new HMSLocalAudioTrackWithStateMachine(stream, track, source, settings, eventBus, deviceManager, store);
  }

  /**
   * Create a local video track with state machine
   * TODO: Implement HMSLocalVideoTrackWithStateMachine
   */
  static createLocalVideoTrack(
    _stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    settings: HMSVideoTrackSettings,
    _eventBus: EventBus,
    _deviceManager: DeviceManager,
    _store: Store,
  ): any {
    HMSLogger.d(TrackFactory.TAG, 'Creating local video track with state machine', {
      trackId: track.id,
      source,
      deviceId: settings.deviceId,
    });

    // TODO: Return HMSLocalVideoTrackWithStateMachine once implemented
    throw new Error('HMSLocalVideoTrackWithStateMachine not yet implemented');
  }

  /**
   * Create a remote audio track with state machine
   * TODO: Implement HMSRemoteAudioTrackWithStateMachine
   */
  static createRemoteAudioTrack(
    _stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    _eventBus: EventBus,
    _store: Store,
  ): any {
    HMSLogger.d(TrackFactory.TAG, 'Creating remote audio track with state machine', {
      trackId: track.id,
      source,
    });

    // TODO: Return HMSRemoteAudioTrackWithStateMachine once implemented
    throw new Error('HMSRemoteAudioTrackWithStateMachine not yet implemented');
  }

  /**
   * Create a remote video track with state machine
   * TODO: Implement HMSRemoteVideoTrackWithStateMachine
   */
  static createRemoteVideoTrack(
    _stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    _eventBus: EventBus,
    _store: Store,
  ): any {
    HMSLogger.d(TrackFactory.TAG, 'Creating remote video track with state machine', {
      trackId: track.id,
      source,
    });

    // TODO: Return HMSRemoteVideoTrackWithStateMachine once implemented
    throw new Error('HMSRemoteVideoTrackWithStateMachine not yet implemented');
  }

  /**
   * Helper to determine track type from MediaStreamTrack
   */
  static getTrackType(track: MediaStreamTrack): HMSTrackType {
    return track.kind === 'audio' ? HMSTrackType.AUDIO : HMSTrackType.VIDEO;
  }

  /**
   * Helper to validate track before creation
   */
  static validateTrack(track: MediaStreamTrack): void {
    if (!track) {
      throw new Error('Track is null or undefined');
    }

    if (track.readyState === 'ended') {
      throw new Error('Track has already ended');
    }

    if (track.kind !== 'audio' && track.kind !== 'video') {
      throw new Error(`Invalid track kind: ${track.kind}`);
    }
  }
}
