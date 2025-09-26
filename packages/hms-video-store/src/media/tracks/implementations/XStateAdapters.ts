/**
 * Adapter classes for XState implementations
 * These wrap the XState implementations to be compatible with the original classes
 */
// Import base classes - these create the circular dependency
// We'll use require() for the state machine classes to break the cycle
import { DeviceManager } from '../../../device-manager';
import { EventBus } from '../../../events/EventBus';
import HMSRoom from '../../../sdk/models/HMSRoom';
import { Store } from '../../../sdk/store';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../../settings';
import { HMSLocalStream } from '../../streams';
import { HMSLocalAudioTrack } from '../HMSLocalAudioTrack';
import { HMSLocalVideoTrack } from '../HMSLocalVideoTrack';

/**
 * Adapter for XState audio track implementation
 */
export class XStateAudioTrackAdapter extends HMSLocalAudioTrack {
  private stateMachine: any; // Will be HMSLocalAudioTrackWithStateMachine

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings: HMSAudioTrackSettings,
    room?: HMSRoom,
  ) {
    super(stream, track, source, eventBus, settings, room);

    // Create state machine instance with Store and DeviceManager
    const store = (room as any)?.store || ({} as Store);
    const deviceManager = new DeviceManager(store, eventBus);

    // Lazy load to avoid circular dependency
    const { HMSLocalAudioTrackWithStateMachine } = require('../HMSLocalAudioTrackWithStateMachine');
    this.stateMachine = new HMSLocalAudioTrackWithStateMachine(
      stream.nativeStream,
      track,
      source as any,
      settings,
      eventBus,
      deviceManager,
      store,
    );
  }

  // Override key methods to delegate to state machine
  async setEnabled(value: boolean): Promise<void> {
    await this.stateMachine.setEnabled(value);
    await super.setEnabled(value);
  }

  // Note: HMSLocalAudioTrack.replaceTrackWith expects settings, not track
  // We'll need to handle this differently
  async replaceTrackWith(settings: HMSAudioTrackSettings): Promise<void> {
    // For now, just delegate to parent
    await super.replaceTrackWith(settings);
  }

  async setSettings(settings: Partial<HMSAudioTrackSettings>): Promise<void> {
    await this.stateMachine.setSettings(settings as HMSAudioTrackSettings);
    await super.setSettings(settings);
  }
}

/**
 * Adapter for XState video track implementation
 */
export class XStateVideoTrackAdapter extends HMSLocalVideoTrack {
  private stateMachine: any; // Will be HMSLocalVideoTrackWithStateMachine

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings: HMSVideoTrackSettings,
    room?: HMSRoom,
  ) {
    super(stream, track, source, eventBus, settings, room);

    // Create state machine instance
    const deviceManager = new DeviceManager((room as any)?.store || ({} as Store), eventBus);

    // Lazy load to avoid circular dependency
    const { HMSLocalVideoTrackWithStateMachine } = require('../HMSLocalVideoTrackWithStateMachine');
    this.stateMachine = new HMSLocalVideoTrackWithStateMachine(
      stream.nativeStream,
      track,
      source as any,
      settings,
      eventBus,
      deviceManager,
      room,
    );
  }

  // Override key methods to delegate to state machine
  async setEnabled(value: boolean): Promise<void> {
    await this.stateMachine.setEnabled(value);
    await super.setEnabled(value);
  }

  // Note: HMSLocalVideoTrack.replaceTrackWith expects settings and returns MediaStreamTrack
  async replaceTrackWith(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
    // For now, just delegate to parent
    return super.replaceTrackWith(settings);
  }

  async setSettings(settings: Partial<HMSVideoTrackSettings>): Promise<void> {
    await this.stateMachine.setSettings(settings as HMSVideoTrackSettings);
    await super.setSettings(settings);
  }

  async switchCamera(): Promise<void> {
    await this.stateMachine.switchCamera();
    await super.switchCamera();
  }
}
