import { TrackContext, TrackEvent, trackStateMachine } from './state-machines/trackStateMachine';
import { TrackStateMachineAdapter } from './state-machines/TrackStateMachineAdapter';
import { EventBus } from '../../events/EventBus';
import { HMSTrackSource, HMSTrackType } from '../../interfaces';
import HMSLogger from '../../utils/logger';

/**
 * Base track class using XState for state management
 * This is a refactored version that reduces redundant code and provides cleaner state management
 */
export abstract class HMSTrackWithStateMachine extends TrackStateMachineAdapter<
  TrackContext,
  TrackEvent,
  typeof trackStateMachine
> {
  readonly type: HMSTrackType;
  protected _transceiver?: RTCRtpTransceiver;

  constructor(
    stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    eventBus: EventBus,
    type: HMSTrackType,
  ) {
    const initialContext: Partial<TrackContext> = {
      trackId: track.id,
      source,
      enabled: track.enabled,
    };

    super(trackStateMachine, eventBus, `[${type}Track]`, initialContext);

    this.type = type;
    this.setNativeTrack(track);
    this.setupTrackListeners(track);
  }

  // Public API matching original interface
  get trackId(): string {
    return this.context.trackId;
  }

  get enabled(): boolean {
    return this.context.enabled;
  }

  get source(): HMSTrackSource | undefined {
    return this.context.source;
  }

  get peerId(): string | undefined {
    return this.context.peerId;
  }

  set peerId(id: string | undefined) {
    // Update context directly since peerId doesn't have state transitions
    this.service.getSnapshot().context.peerId = id;
  }

  get nativeTrack(): MediaStreamTrack {
    return this.context.nativeTrack!;
  }

  get transceiver(): RTCRtpTransceiver | undefined {
    return this._transceiver;
  }

  set transceiver(transceiver: RTCRtpTransceiver | undefined) {
    this._transceiver = transceiver;
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }

    HMSLogger.d(this.TAG, `Setting enabled to ${value}`);
    this.send({ type: value ? 'ENABLE' : 'DISABLE' });

    // Let subclasses handle specific enable/disable logic
    await this.handleSetEnabled(value);
  }

  protected abstract handleSetEnabled(value: boolean): Promise<void>;

  protected setNativeTrack(track: MediaStreamTrack): void {
    this.send({ type: 'SET_NATIVE_TRACK', track });
  }

  private setupTrackListeners(track: MediaStreamTrack): void {
    track.addEventListener('ended', this.handleTrackEnded);
    track.addEventListener('mute', this.handleTrackMuted);
    track.addEventListener('unmute', this.handleTrackUnmuted);
  }

  private removeTrackListeners(track: MediaStreamTrack): void {
    track.removeEventListener('ended', this.handleTrackEnded);
    track.removeEventListener('mute', this.handleTrackMuted);
    track.removeEventListener('unmute', this.handleTrackUnmuted);
  }

  private handleTrackEnded = (): void => {
    HMSLogger.d(this.TAG, 'Track ended');
    this.send({ type: 'TRACK_ENDED' });
  };

  private handleTrackMuted = (): void => {
    HMSLogger.d(this.TAG, 'Track muted');
    this.send({ type: 'TRACK_MUTED' });
  };

  private handleTrackUnmuted = (): void => {
    HMSLogger.d(this.TAG, 'Track unmuted');
    this.send({ type: 'TRACK_UNMUTED' });
  };

  protected onStateChange(state: any): void {
    HMSLogger.d(this.TAG, 'State changed:', state.value, state.context);

    // Publish relevant events based on state changes
    if (state.changed) {
      const prevEnabled = state.history?.context.enabled;
      const currEnabled = state.context.enabled;

      if (prevEnabled !== undefined && prevEnabled !== currEnabled) {
        this.publishEnabledChange(currEnabled);
      }
    }
  }

  protected abstract publishEnabledChange(enabled: boolean): void;

  isTrackNotPublishing(): boolean {
    return this.isInState('ended') || this.isInState('ready.muted');
  }

  cleanup(): void {
    if (this.context.nativeTrack) {
      this.removeTrackListeners(this.context.nativeTrack);
      this.context.nativeTrack.stop();
    }
    super.cleanup();
  }

  toString(): string {
    return JSON.stringify({
      id: this.trackId,
      enabled: this.enabled,
      type: this.type,
      source: this.source,
      state: this.state,
    });
  }
}
