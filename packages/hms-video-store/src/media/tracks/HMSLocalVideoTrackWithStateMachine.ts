import { interpret } from 'xstate';
import { LocalTrackContext, LocalTrackEvent, localTrackStateMachine } from './state-machines/localTrackStateMachine';
import { TrackStateMachineAdapter } from './state-machines/TrackStateMachineAdapter';
import { HMSTrackType } from './HMSTrackType';
import { DeviceManager } from '../../device-manager';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { EventBus } from '../../events/EventBus';
import {
  HMSLocalVideoTrackStats,
  HMSSimulcastLayer,
  HMSSimulcastLayerDefinition,
  HMSTrackUpdate,
} from '../../interfaces';
import { HMSVideoPluginsManager } from '../../plugins/video';
import { HMSRoom } from '../../sdk/models/HMSRoom';
import HMSLogger from '../../utils/logger';
import { isIOS } from '../../utils/support';
import { getVideoTrack } from '../../utils/track';
import { HMSVideoTrackSettings } from '../settings';
import { HMSTrackSource } from '../tracks/HMSTrack';

/**
 * Refactored HMSLocalVideoTrack using XState for cleaner state management
 */
export class HMSLocalVideoTrackWithStateMachine extends TrackStateMachineAdapter<
  LocalTrackContext,
  LocalTrackEvent,
  typeof localTrackStateMachine
> {
  readonly type = HMSTrackType.VIDEO;
  private pluginsManager: HMSVideoPluginsManager;
  private tracksCreated = new Set<MediaStreamTrack>();
  private _transceiver?: RTCRtpTransceiver;
  private _layerDefinitions: HMSSimulcastLayerDefinition[] = [];
  private enabledStateBeforeBackground = true;
  private isCurrentTab = false;
  private room?: HMSRoom;

  constructor(
    private stream: MediaStream,
    track: MediaStreamTrack,
    source: HMSTrackSource,
    private settings: HMSVideoTrackSettings,
    protected eventBus: EventBus,
    private deviceManager?: DeviceManager,
    room?: HMSRoom,
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

    super(localTrackStateMachine, eventBus, '[LocalVideoTrack]', initialContext);

    this.room = room;
    this.pluginsManager = new HMSVideoPluginsManager(eventBus);

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
        const track = this.context.nativeTrack || (await this.acquireVideoTrack());
        this.handleTrackEnabled(track);
        return track;
      },
      disableTrack: async () => {
        this.handleTrackDisabled();
      },
      replaceTrack: async (_context: LocalTrackContext, event: any) => {
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

  get facingMode(): string | undefined {
    return this.settings.facingMode;
  }

  get transceiver(): RTCRtpTransceiver | undefined {
    return this._transceiver;
  }

  set transceiver(transceiver: RTCRtpTransceiver | undefined) {
    this._transceiver = transceiver;
  }

  get layerDefinitions(): HMSSimulcastLayerDefinition[] {
    return this._layerDefinitions;
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }

    HMSLogger.d(this.TAG, `Setting enabled to ${value}`);

    if (value) {
      // When enabling, might need to acquire a new track
      if (!this.context.nativeTrack || this.context.nativeTrack.readyState === 'ended') {
        const track = await this.acquireVideoTrack();
        this.send({ type: 'SET_NATIVE_TRACK', track });
      }
    }

    this.send({ type: value ? 'ENABLE' : 'DISABLE' });
  }

  async setSettings(settings: HMSVideoTrackSettings): Promise<void> {
    HMSLogger.d(this.TAG, 'Updating settings', settings);

    this.settings = settings;
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

  async switchCamera(): Promise<void> {
    if (!this.settings.facingMode) {
      HMSLogger.w(this.TAG, 'Cannot switch camera, no facing mode set');
      return;
    }

    const newFacingMode = this.settings.facingMode === 'user' ? 'environment' : 'user';
    const newSettings = new HMSVideoTrackSettings({
      ...this.settings,
      facingMode: newFacingMode,
    });

    await this.setSettings(newSettings);
  }

  async cropTo(cropTarget?: unknown): Promise<void> {
    if (!cropTarget) {
      return;
    }

    try {
      // @ts-ignore
      await this.nativeTrack.cropTo(cropTarget);
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to crop video', error);
      throw error;
    }
  }

  getCaptureHandle(): any {
    // @ts-ignore
    return this.nativeTrack.getCaptureHandle?.();
  }

  setSimulcastDefinitons(definitions?: HMSSimulcastLayerDefinition[]): void {
    this._layerDefinitions = definitions || [];
  }

  async setDegradation(enable: boolean): Promise<void> {
    if (!this._transceiver?.sender) {
      return;
    }

    const parameters = this._transceiver.sender.getParameters();
    parameters.degradationPreference = enable ? 'maintain-framerate' : 'balanced';
    await this._transceiver.sender.setParameters(parameters);
  }

  getStats(): Promise<HMSLocalVideoTrackStats | undefined> {
    // Implementation would go here
    return Promise.resolve(undefined);
  }

  getSimulcastDefinition(layer: HMSSimulcastLayer): HMSSimulcastLayerDefinition | undefined {
    return this._layerDefinitions.find(def => def.layer === layer);
  }

  private async replaceTrackWithDevice(deviceId: string): Promise<void> {
    try {
      const newSettings = new HMSVideoTrackSettings({ ...this.settings, deviceId });
      const track = await getVideoTrack(newSettings);
      await this.replaceTrackWith(track, deviceId);
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to replace track with device', error);
      this.send({ type: 'REPLACE_TRACK_FAILURE', error: error as Error });
    }
  }

  private async performTrackReplacement(newTrack: MediaStreamTrack, _deviceId?: string): Promise<void> {
    const oldTrack = this.context.nativeTrack;

    // Clean up old track
    this.cleanupOldTrack(oldTrack);

    // Set up new track
    this.setupNewTrack(newTrack);

    // Update stream
    this.updateStream(oldTrack, newTrack);

    // Update transceiver if published
    if (this.context.isPublished && this._transceiver?.sender) {
      await this._transceiver.sender.replaceTrack(this.context.processedTrack || newTrack);
    }

    // Reprocess plugins if needed
    if (this.pluginsManager.getPlugins().length > 0) {
      await this.reprocessPlugins(newTrack);
    }
  }

  private cleanupOldTrack(oldTrack?: MediaStreamTrack): void {
    if (oldTrack) {
      this.removeTrackListeners(oldTrack);
      oldTrack.stop();
      this.tracksCreated.delete(oldTrack);
    }
  }

  private setupNewTrack(newTrack: MediaStreamTrack): void {
    this.tracksCreated.add(newTrack);
    this.setupTrackListeners(newTrack);
  }

  private updateStream(oldTrack: MediaStreamTrack | undefined, newTrack: MediaStreamTrack): void {
    if (this.stream) {
      if (oldTrack) {
        this.stream.removeTrack(oldTrack);
      }
      this.stream.addTrack(newTrack);
    }
  }

  private async reprocessPlugins(track: MediaStreamTrack): Promise<void> {
    try {
      const processedTrack = await this.pluginsManager.processVideoTrack(track, this);
      this.send({ type: 'SET_PROCESSED_TRACK', track: processedTrack });
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to reprocess plugins', error);
    }
  }

  private async acquireVideoTrack(): Promise<MediaStreamTrack> {
    try {
      return await getVideoTrack(this.settings);
    } catch (error) {
      throw ErrorFactory.TracksErrors.VideoTrackSettingsError(HMSAction.TRACK, 'Failed to acquire video track');
    }
  }

  private handleTrackEnabled(track: MediaStreamTrack): void {
    track.enabled = true;
    this.eventBus.localVideoEnabled.publish({ enabled: true, track: this });
  }

  private handleTrackDisabled(): void {
    if (this.context.nativeTrack) {
      // Replace with blank track for iOS
      if (isIOS() && this.context.isPublished && this._transceiver?.sender) {
        const blankTrack = this.createBlankVideoTrack();
        this._transceiver.sender.replaceTrack(blankTrack).then(() => {
          blankTrack.stop();
        });
      } else {
        this.context.nativeTrack.enabled = false;
      }
    }
    this.eventBus.localVideoEnabled.publish({ enabled: false, track: this });
  }

  private createBlankVideoTrack(): MediaStreamTrack {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const stream = canvas.captureStream(1);
    return stream.getVideoTracks()[0];
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

  private listenToVisibilityChange(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.enabledStateBeforeBackground = this.enabled;
      this.send({ type: 'VISIBILITY_HIDDEN' });
      // Disable track on background for iOS
      if (isIOS() && this.enabled) {
        this.setEnabled(false);
      }
    } else {
      this.send({ type: 'VISIBILITY_VISIBLE' });
      // Restore state on foreground for iOS
      if (isIOS() && this.enabledStateBeforeBackground) {
        this.setEnabled(true);
      }
    }
  };

  private trackPermissions(): void {
    // Simplified permission tracking
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
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
        this.eventBus.localVideoEnabled.publish({
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
    // Cleanup plugins
    await this.pluginsManager.cleanup();

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
      facingMode: this.facingMode,
      state: this.state,
    });
  }
}
