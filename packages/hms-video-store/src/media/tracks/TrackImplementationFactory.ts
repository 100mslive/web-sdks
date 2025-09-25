/**
 * Factory to select between original and XState implementations
 * This allows us to toggle between implementations for testing
 */

import { HMSLocalStream } from '../streams';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../settings';
import { EventBus } from '../../events/EventBus';
import { HMSRoom } from '../../sdk/models/HMSRoom';
import { Store } from '../../sdk/store';
import { DeviceManager } from '../../device-manager';

// Original implementations
import { HMSLocalAudioTrack as OriginalHMSLocalAudioTrack } from './HMSLocalAudioTrack';
import { HMSLocalVideoTrack as OriginalHMSLocalVideoTrack } from './HMSLocalVideoTrack';

// XState implementations - these wrap the originals
import { HMSLocalAudioTrackWithStateMachine } from './HMSLocalAudioTrackWithStateMachine';
import { HMSLocalVideoTrackWithStateMachine } from './HMSLocalVideoTrackWithStateMachine';

// Extend the XState classes to be compatible with originals
class XStateAudioTrackAdapter extends OriginalHMSLocalAudioTrack {
  private stateMachine: HMSLocalAudioTrackWithStateMachine;

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
    // For now, we'll use stubs since these aren't passed to original constructor
    const store = (room as any)?.store || ({} as Store);
    const deviceManager = new DeviceManager(store, eventBus);
    
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

  async replaceTrackWith(track: MediaStreamTrack, deviceId?: string): Promise<void> {
    await this.stateMachine.replaceTrackWith(track, deviceId);
    await super.replaceTrackWith(track, deviceId);
  }

  async setSettings(settings: Partial<HMSAudioTrackSettings>): Promise<void> {
    await this.stateMachine.setSettings(settings as HMSAudioTrackSettings);
    await super.setSettings(settings);
  }
}

class XStateVideoTrackAdapter extends OriginalHMSLocalVideoTrack {
  private stateMachine: HMSLocalVideoTrackWithStateMachine;

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

  async replaceTrackWith(track: MediaStreamTrack, deviceId?: string): Promise<void> {
    await this.stateMachine.replaceTrackWith(track, deviceId);
    await super.replaceTrackWith(track, deviceId);
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

export class TrackImplementationFactory {
  private static USE_XSTATE = false; // Toggle this to switch implementations

  static enableXState(enable: boolean) {
    TrackImplementationFactory.USE_XSTATE = enable;
  }

  static createLocalAudioTrack(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings?: HMSAudioTrackSettings,
    room?: HMSRoom,
  ): OriginalHMSLocalAudioTrack {
    if (TrackImplementationFactory.USE_XSTATE) {
      return new XStateAudioTrackAdapter(stream, track, source, eventBus, settings!, room);
    }
    return new OriginalHMSLocalAudioTrack(stream, track, source, eventBus, settings, room);
  }

  static createLocalVideoTrack(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    eventBus: EventBus,
    settings?: HMSVideoTrackSettings,
    room?: HMSRoom,
  ): OriginalHMSLocalVideoTrack {
    if (TrackImplementationFactory.USE_XSTATE) {
      return new XStateVideoTrackAdapter(stream, track, source, eventBus, settings!, room);
    }
    return new OriginalHMSLocalVideoTrack(stream, track, source, eventBus, settings, room);
  }
}