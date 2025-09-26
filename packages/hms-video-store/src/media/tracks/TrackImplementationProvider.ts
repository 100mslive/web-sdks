/**
 * Simple provider pattern for track implementations
 * This avoids circular dependencies by using late binding
 */
import { EventBus } from '../../events/EventBus';
import HMSRoom from '../../sdk/models/HMSRoom';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../settings';
import { HMSLocalStream } from '../streams';

// We use any return type to avoid circular dependencies
// The actual types are HMSLocalAudioTrack and HMSLocalVideoTrack

/**
 * Provider for track implementations
 * Uses late binding to avoid circular dependencies
 */
export class TrackImplementationProvider {
  private static useXState = false;

  /**
   * Enable or disable XState implementation
   */
  static enableXState(enable: boolean): void {
    TrackImplementationProvider.useXState = enable;
  }

  /**
   * Check if XState is enabled
   */
  static isXStateEnabled(): boolean {
    return TrackImplementationProvider.useXState;
  }

  /**
   * Create a local audio track
   * Uses require() to avoid circular dependencies
   */
  static createLocalAudioTrack(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings?: HMSAudioTrackSettings,
    room?: HMSRoom,
  ): any {
    if (TrackImplementationProvider.useXState) {
      // Lazy load XState adapter
      const { XStateAudioTrackAdapter } = require('./implementations/XStateAdapters');
      return new XStateAudioTrackAdapter(stream, track, source, eventBus, settings!, room);
    } else {
      // Lazy load default implementation
      const { HMSLocalAudioTrack } = require('./HMSLocalAudioTrack');
      return new HMSLocalAudioTrack(stream, track, source, eventBus, settings, room);
    }
  }

  /**
   * Create a local video track
   * Uses require() to avoid circular dependencies
   */
  static createLocalVideoTrack(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings?: HMSVideoTrackSettings,
    room?: HMSRoom,
  ): any {
    if (TrackImplementationProvider.useXState) {
      // Lazy load XState adapter
      const { XStateVideoTrackAdapter } = require('./implementations/XStateAdapters');
      return new XStateVideoTrackAdapter(stream, track, source, eventBus, settings!, room);
    } else {
      // Lazy load default implementation
      const { HMSLocalVideoTrack } = require('./HMSLocalVideoTrack');
      return new HMSLocalVideoTrack(stream, track, source, eventBus, settings, room);
    }
  }

  /**
   * Initialize from URL parameter
   */
  static initializeFromURL(): void {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('xstate') === 'true') {
        TrackImplementationProvider.enableXState(true);
        console.log('🚀 XState tracking enabled via URL parameter');
      }
    }
  }
}

// Auto-initialize on module load
TrackImplementationProvider.initializeFromURL();
