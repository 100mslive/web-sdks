import { interpret } from 'xstate';
import { LocalTrackContext, LocalTrackEvent, localTrackStateMachine } from './state-machines/localTrackStateMachine';
import { TrackStateMachineAdapter } from './state-machines/TrackStateMachineAdapter';
import { DeviceManager } from '../../device-manager';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { EventBus } from '../../events/EventBus';
import { HMSTrackSource, HMSTrackType, HMSTrackUpdate } from '../../interfaces';
import { HMSAudioPluginsManager } from '../../plugins/audio';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { getAudioTrack } from '../../utils/track';
import { TrackAudioLevelMonitor } from '../../utils/track-audio-level-monitor';
import { HMSAudioTrackSettings } from '../settings';

/**
 * Refactored HMSLocalAudioTrack using XState for cleaner state management
 */
export class HMSLocalAudioTrackWithStateMachine extends TrackStateMachineAdapter<
  LocalTrackContext,
  LocalTrackEvent,
  typeof localTrackStateMachine
> {
  readonly type = HMSTrackType.AUDIO;
  private audioLevelMonitor?: TrackAudioLevelMonitor;
  private pluginsManager: HMSAudioPluginsManager;
  private tracksCreated = new Set<MediaStreamTrack>();
  private _transceiver?: RTCRtpTransceiver;
  private _volume = 100;

  constructor(
    private stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    private settings: HMSAudioTrackSettings,
    private eventBus: EventBus,
    private deviceManager: DeviceManager,
    private store: Store,
  ) {
    const initialContext: Partial<LocalTrackContext> = {
      trackId: track.id,
      source,
      enabled: track.enabled,
      nativeTrack: track,
      settings,
      deviceId: settings.deviceId,
      isPublished: false,
    };

    super(localTrackStateMachine, eventBus, '[LocalAudioTrack]', initialContext);

    this.pluginsManager = new HMSAudioPluginsManager(store, eventBus);

    // Configure state machine services
    this.configureServices();

    // Initialize track
    this.initializeTrack(track);
  }

  // Configure state machine services/actions
  private configureServices(): void {
    // Add service implementations
    const services = {
      enableTrack: async () => {
        const track = await this.acquireAudioTrack();
        this.handleTrackEnabled(track);
        return track;
      },
      disableTrack: async () => {
        this.handleTrackDisabled();
      },
      replaceTrack: async (context: LocalTrackContext, event: any) => {
        const { track, deviceId } = event;
        await this.performTrackReplacement(track, deviceId);
        return { track, deviceId };
      },
      publishTrack: async () => {
        // Implement publish logic
        return { trackId: this.context.trackId };
      },
      unpublishTrack: async () => {
        // Implement unpublish logic
      },
    };

    // Update machine with services
    this.service.stop();
    this.service = interpret(this.machine.withConfig({ services }).withContext(this.context));
    this.service.onTransition(state => {
      if (state.changed) {
        this.onStateChange(state);
      }
    });
    this.service.start();
  }

  private initializeTrack(track: MediaStreamTrack): void {
    this.tracksCreated.add(track);
    this.setupTrackListeners(track);
    this.startAudioLevelMonitor();
    this.listenToVisibilityChange();
    this.trackPermissions();
  }

  // Public API
  get trackId(): string {
    return this.context.trackId;
  }

  get enabled(): boolean {
    return this.context.enabled;
  }

  get nativeTrack(): MediaStreamTrack {
    return this.context.nativeTrack!;
  }

  get processedTrack(): MediaStreamTrack | undefined {
    return this.context.processedTrack;
  }

  get deviceId(): string | undefined {
    return this.context.deviceId;
  }

  get volume(): number {
    return this._volume;
  }

  async setVolume(value: number): Promise<void> {
    this._volume = Math.max(0, Math.min(100, value));
    this.audioLevelMonitor?.setVolume(this._volume);
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
  }

  async setSettings(settings: HMSAudioTrackSettings): Promise<void> {
    HMSLogger.d(this.TAG, 'Updating settings', settings);

    this.send({ type: 'UPDATE_SETTINGS', settings });

    // If device changed, trigger track replacement
    if (settings.deviceId && settings.deviceId !== this.context.deviceId) {
      await this.replaceTrackWithDevice(settings.deviceId);
    }
  }

  async replaceTrackWith(track: MediaStreamTrack, deviceId?: string): Promise<void> {
    HMSLogger.d(this.TAG, 'Replacing track');
    this.send({ type: 'REPLACE_TRACK', track, deviceId });
  }

  private async replaceTrackWithDevice(deviceId: string): Promise<void> {
    try {
      const newSettings = new HMSAudioTrackSettings({ ...this.settings, deviceId });
      const track = await getAudioTrack(newSettings);
      await this.replaceTrackWith(track, deviceId);
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to replace track with device', error);
      this.send({ type: 'REPLACE_TRACK_FAILURE', error: error as Error });
    }
  }

  private async performTrackReplacement(newTrack: MediaStreamTrack, _deviceId?: string): Promise<void> {
    const oldTrack = this.context.nativeTrack;

    // Remove old track
    if (oldTrack) {
      this.removeTrackListeners(oldTrack);
      oldTrack.stop();
      this.tracksCreated.delete(oldTrack);
    }

    // Add new track
    this.tracksCreated.add(newTrack);
    this.setupTrackListeners(newTrack);

    // Update transceiver if published
    if (this.context.isPublished && this._transceiver?.sender) {
      await this._transceiver.sender.replaceTrack(this.context.processedTrack || newTrack);
    }

    // Reprocess plugins if needed
    if (this.pluginsManager.getPlugins().length > 0) {
      await this.reprocessPlugins(newTrack);
    }
  }

  private async reprocessPlugins(track: MediaStreamTrack): Promise<void> {
    try {
      const processedTrack = await this.pluginsManager.processAudioTrack(track);
      this.send({ type: 'SET_PROCESSED_TRACK', track: processedTrack });
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to reprocess plugins', error);
    }
  }

  private async acquireAudioTrack(): Promise<MediaStreamTrack> {
    try {
      return await getAudioTrack(this.settings);
    } catch (error) {
      throw ErrorFactory.TracksErrors.AudioTrackSettingsError(HMSAction.TRACK, 'Failed to acquire audio track');
    }
  }

  private handleTrackEnabled(track: MediaStreamTrack): void {
    track.enabled = true;
    this.eventBus.localAudioEnabled.publish({ enabled: true, track: this });
  }

  private handleTrackDisabled(): void {
    if (this.context.nativeTrack) {
      this.context.nativeTrack.enabled = false;
    }
    this.eventBus.localAudioEnabled.publish({ enabled: false, track: this });
  }

  private setupTrackListeners(track: MediaStreamTrack): void {
    track.addEventListener('mute', this.handleTrackMute);
    track.addEventListener('unmute', this.handleTrackUnmute);
    track.addEventListener('ended', this.handleTrackEnded);
  }

  private removeTrackListeners(track: MediaStreamTrack): void {
    track.removeEventListener('mute', this.handleTrackMute);
    track.removeEventListener('unmute', this.handleTrackUnmute);
    track.removeEventListener('ended', this.handleTrackEnded);
  }

  private handleTrackMute = (): void => {
    this.send({ type: 'TRACK_MUTED' });
  };

  private handleTrackUnmute = (): void => {
    this.send({ type: 'TRACK_UNMUTED' });
  };

  private handleTrackEnded = (): void => {
    this.send({ type: 'TRACK_ENDED' });
  };

  private startAudioLevelMonitor(): void {
    this.audioLevelMonitor = new TrackAudioLevelMonitor(this.context.nativeTrack!, this.eventBus);
    this.audioLevelMonitor.start();
    this.audioLevelMonitor.detectSilence();
  }

  private listenToVisibilityChange(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.send({ type: 'VISIBILITY_HIDDEN' });
    } else {
      this.send({ type: 'VISIBILITY_VISIBLE' });
    }
  };

  private trackPermissions(): void {
    // Simplified permission tracking
    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then(permission => {
        permission.addEventListener('change', () => {
          const eventType =
            permission.state === 'granted'
              ? 'PERMISSION_GRANTED'
              : permission.state === 'denied'
              ? 'PERMISSION_DENIED'
              : 'PERMISSION_PROMPT';
          this.send({ type: eventType });
        });

        // Set initial state
        const eventType =
          permission.state === 'granted'
            ? 'PERMISSION_GRANTED'
            : permission.state === 'denied'
            ? 'PERMISSION_DENIED'
            : 'PERMISSION_PROMPT';
        this.send({ type: eventType });
      })
      .catch(() => {
        // Permissions API not available
      });
  }

  protected onStateChange(state: any): void {
    HMSLogger.d(this.TAG, 'State changed:', JSON.stringify(state.value));

    // Publish track updates based on state changes
    if (state.changed) {
      // Check for enable/disable changes
      const prevEnabled = state.history?.context.enabled;
      const currEnabled = state.context.enabled;

      if (prevEnabled !== undefined && prevEnabled !== currEnabled) {
        this.eventBus.localAudioEnabled.publish({
          enabled: currEnabled,
          track: this,
        });
      }

      // Check for track replacement completion
      if (!state.context.isReplacing && state.history?.context.isReplacing) {
        this.eventBus.localTrackUpdate.publish({
          track: this,
          type: HMSTrackUpdate.TRACK_RESTORED,
        });
      }
    }
  }

  getTrackIDBeingSent(): string {
    return this.context.processedTrack?.id || this.context.trackId;
  }

  getTrackBeingSent(): MediaStreamTrack {
    return this.context.processedTrack || this.context.nativeTrack!;
  }

  async cleanup(): Promise<void> {
    // Stop audio level monitor
    this.audioLevelMonitor?.stop();
    this.audioLevelMonitor = undefined;

    // Cleanup plugins
    await this.pluginsManager.cleanup();
    await this.pluginsManager.closeContext();

    // Stop all created tracks
    this.tracksCreated.forEach(track => track.stop());
    this.tracksCreated.clear();

    // Remove listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Stop state machine
    super.cleanup();
  }

  toString(): string {
    return JSON.stringify({
      id: this.trackId,
      enabled: this.enabled,
      type: this.type,
      source: this.context.source,
      deviceId: this.context.deviceId,
      state: this.state,
    });
  }
}
