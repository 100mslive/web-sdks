import isEqual from 'lodash.isequal';
import { HMSVideoTrack } from './HMSVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';
import {
  HMSFacingMode,
  HMSSimulcastLayerDefinition,
  HMSVideoTrackSettings as IHMSVideoTrackSettings,
  ScreenCaptureHandle,
} from '../../interfaces';
import { HMSPluginSupportResult, HMSVideoPlugin } from '../../plugins';
import { HMSMediaStreamPlugin, HMSVideoPluginsManager } from '../../plugins/video';
import { HMSMediaStreamPluginsManager } from '../../plugins/video/HMSMediaStreamPluginsManager';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import Room from '../../sdk/models/HMSRoom';
import HMSLogger from '../../utils/logger';
import { isBrowser, isMobile } from '../../utils/support';
import { getVideoTrack, isEmptyTrack, listenToPermissionChange } from '../../utils/track';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from '../settings';
import { HMSLocalStream } from '../streams';

function generateHasPropertyChanged(newSettings: Partial<HMSVideoTrackSettings>, oldSettings: HMSVideoTrackSettings) {
  return function hasChanged(
    prop: 'codec' | 'width' | 'height' | 'maxFramerate' | 'maxBitrate' | 'deviceId' | 'advanced' | 'facingMode',
  ) {
    return !isEqual(newSettings[prop], oldSettings[prop]);
  };
}

export class HMSLocalVideoTrack extends HMSVideoTrack {
  settings: HMSVideoTrackSettings;
  private pluginsManager: HMSVideoPluginsManager;
  private mediaStreamPluginsManager: HMSMediaStreamPluginsManager;
  private processedTrack?: MediaStreamTrack;
  private _layerDefinitions: HMSSimulcastLayerDefinition[] = [];
  private TAG = '[HMSLocalVideoTrack]';
  private enabledStateBeforeBackground = false;

  /**
   * true if it's screenshare and current tab is what is being shared. Browser dependent, Chromium only
   * at the point of writing this comment.
   */
  isCurrentTab = false;

  /**
   * @internal
   * This is required for handling remote mute/unmute as the published track will not necessarily be same as
   * the first track id or current native track's id.
   * It won't be same as first track id if the native track was changed after preview started but before join happened,
   * with device change, or mute/unmute.
   * It won't be same as native track id, as the native track can change post join(and publish), when the nativetrack
   * changes, replacetrack is used which doesn't involve republishing which means from server's point of view, the track id
   * is same as what was initially published.
   * This will only be available if the track was actually published and won't be set for preview tracks.
   */
  publishedTrackId?: string;

  /**
   * will be false for preview tracks
   */
  isPublished = false;

  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    private eventBus: EventBus,
    settings: HMSVideoTrackSettings = new HMSVideoTrackSettingsBuilder().build(),
    private room?: Room,
  ) {
    super(stream, track, source);
    this.addTrackEventListeners(track);
    this.trackPermissions();
    stream.tracks.push(this);
    this.setVideoHandler(new VideoElementManager(this));
    this.settings = settings;
    // Replace the 'default' or invalid deviceId with the actual deviceId
    // This is to maintain consistency with selected devices as in some cases there will be no 'default' device
    if (settings.deviceId !== track.getSettings().deviceId && track.enabled) {
      this.settings = this.buildNewSettings({ deviceId: track.getSettings().deviceId });
    }
    this.pluginsManager = new HMSVideoPluginsManager(this, eventBus);
    this.mediaStreamPluginsManager = new HMSMediaStreamPluginsManager(eventBus, room);
    this.setFirstTrackId(this.trackId);
    this.eventBus.localAudioUnmutedNatively.subscribe(this.handleTrackUnmute);
    if (isBrowser && source === 'regular' && isMobile()) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  clone(stream: HMSLocalStream) {
    const clonedTrack = this.nativeTrack.clone();
    /**
     * stream only becomes active when the track is added to it. If this is not added, after sfu migration, in non-simulcast case, the video will not be
     * published to the server
     */
    stream.nativeStream.addTrack(clonedTrack);
    const track = new HMSLocalVideoTrack(stream, clonedTrack, this.source!, this.eventBus, this.settings, this.room);
    track.peerId = this.peerId;

    if (this.pluginsManager.pluginsMap.size > 0) {
      this.pluginsManager.pluginsMap.forEach(value => {
        track
          .addPlugin(value)
          .catch((e: Error) => HMSLogger.e(this.TAG, 'Plugin add failed while migrating', value, e));
      });
    }
    if (this.mediaStreamPluginsManager.plugins.size > 0) {
      track.addStreamPlugins(Array.from(this.mediaStreamPluginsManager.plugins));
    }
    return track;
  }

  /** @internal */
  setSimulcastDefinitons(definitions: HMSSimulcastLayerDefinition[]) {
    this._layerDefinitions = definitions;
  }

  /**
   * Method to get available simulcast definitions for the track
   * @returns {HMSSimulcastLayerDefinition[]}
   */
  getSimulcastDefinitions(): HMSSimulcastLayerDefinition[] {
    return this._layerDefinitions;
  }

  /**
   * use this function to set the enabled state of a track. If true the track will be unmuted and muted otherwise.
   * @param value
   */
  // eslint-disable-next-line complexity
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }
    if (this.source === 'regular') {
      let track: MediaStreamTrack;
      if (value) {
        track = await this.replaceTrackWith(this.settings);
      } else {
        track = await this.replaceTrackWithBlank();
      }
      await this.replaceSender(track, value);
      this.nativeTrack?.stop();
      this.nativeTrack = track;
      await super.setEnabled(value);
      if (value) {
        await this.pluginsManager.waitForRestart();
        await this.processPlugins();
        this.settings = this.buildNewSettings({ deviceId: track.getSettings().deviceId });
      }
      this.videoHandler.updateSinks();
    }
    this.eventBus.localVideoEnabled.publish({ enabled: value, track: this });
  }

  private async processPlugins() {
    try {
      if (this.pluginsManager.getPlugins().length > 0) {
        return;
      }
      const plugins = this.mediaStreamPluginsManager.getPlugins();
      if (plugins.length > 0) {
        const processedStream = this.mediaStreamPluginsManager.applyPlugins(new MediaStream([this.nativeTrack]));
        const newTrack = processedStream.getVideoTracks()[0];
        await this.setProcessedTrack(newTrack);
      } else {
        await this.setProcessedTrack();
      }
      this.videoHandler.updateSinks();
    } catch (e) {
      console.error('error in processing plugin(s)', e);
    }
  }

  async addStreamPlugins(plugins: HMSMediaStreamPlugin[]) {
    if (this.pluginsManager.getPlugins().length > 0) {
      throw Error('Plugins of type HMSMediaStreamPlugin and HMSVideoPlugin cannot be used together');
    }
    this.mediaStreamPluginsManager.addPlugins(plugins);
    await this.processPlugins();
  }

  async removeStreamPlugins(plugins: HMSMediaStreamPlugin[]) {
    this.mediaStreamPluginsManager.removePlugins(plugins);
    await this.processPlugins();
  }

  /**
   * verify if the track id being passed is of this track for correlating server messages like degradation
   */
  isPublishedTrackId(trackId: string) {
    return this.publishedTrackId === trackId;
  }

  /**
   * @see HMSVideoTrack#addSink()
   */
  addSink(videoElement: HTMLVideoElement) {
    this.addSinkInternal(videoElement, this.processedTrack || this.nativeTrack);
  }

  /**
   * This function can be used to set media track settings. Frequent options -
   * deviceID: can be used to change to different input source
   * width, height - can be used to change capture dimensions
   * maxFramerate - can be used to control the capture framerate
   * @param settings
   */
  async setSettings(settings: Partial<IHMSVideoTrackSettings>, internal = false) {
    const newSettings = this.buildNewSettings(settings);
    await this.handleDeviceChange(newSettings, internal);
    if (!this.enabled || isEmptyTrack(this.nativeTrack)) {
      // if track is muted, we just cache the settings for when it is unmuted
      this.settings = newSettings;
      return;
    } else {
      await this.pluginsManager.waitForRestart();
    }
    await this.handleSettingsChange(newSettings);
    this.settings = newSettings;
  }

  /**
   * @see HMSVideoPlugin
   */
  getPlugins(): string[] {
    return this.mediaStreamPluginsManager.getPlugins().length > 0
      ? this.mediaStreamPluginsManager.getPlugins()
      : this.pluginsManager.getPlugins();
  }

  /**
   * @see HMSVideoPlugin
   */
  async addPlugin(plugin: HMSVideoPlugin, pluginFrameRate?: number): Promise<void> {
    if (this.mediaStreamPluginsManager.getPlugins().length > 0) {
      throw Error('Plugins of type HMSVideoPlugin and HMSMediaStreamPlugin cannot be used together');
    }
    return this.pluginsManager.addPlugin(plugin, pluginFrameRate);
  }

  /**
   * @see HMSVideoPlugin
   */
  async removePlugin(plugin: HMSVideoPlugin): Promise<void> {
    return this.pluginsManager.removePlugin(plugin);
  }

  /**
   * @see HMSVideoPlugin
   */
  validatePlugin(plugin: HMSVideoPlugin): HMSPluginSupportResult {
    return this.pluginsManager.validatePlugin(plugin);
  }

  /**
   * @internal
   */
  async cleanup() {
    this.eventBus.localAudioUnmutedNatively.unsubscribe(this.handleTrackUnmute);
    this.removeTrackEventListeners(this.nativeTrack);
    // Stopping the plugin before cleaning the track is more predictable when dealing with 3rd party plugins
    await this.mediaStreamPluginsManager.cleanup();
    await this.pluginsManager.cleanup();
    super.cleanup();
    this.transceiver = undefined;
    this.processedTrack?.stop();
    this.isPublished = false;
    if (isBrowser && isMobile()) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * only for screenshare track to crop to a cropTarget
   * @internal
   */
  async cropTo(cropTarget?: object) {
    if (!cropTarget) {
      return;
    }
    if (this.source !== 'screen') {
      return;
    }
    try {
      // @ts-ignore
      if (this.nativeTrack.cropTo) {
        // @ts-ignore
        await this.nativeTrack.cropTo(cropTarget);
      }
    } catch (err) {
      HMSLogger.e(this.TAG, 'failed to crop screenshare capture - ', err);
      throw ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, 'failed to crop screenshare capture');
    }
  }

  /**
   * only for screenshare track to get the captureHandle
   * TODO: add an API for capturehandlechange event
   * @internal
   */
  getCaptureHandle(): ScreenCaptureHandle | undefined {
    // @ts-ignore
    if (this.nativeTrack.getCaptureHandle) {
      // @ts-ignore
      return this.nativeTrack.getCaptureHandle();
    }
    return undefined;
  }

  /**
   * once the plugin manager has done its processing it can set or remove processed track via this method
   * note that replacing sender track only makes sense if the native track is enabled. if it's disabled there is
   * no point in replacing it. We'll update the processed track variable though so next time unmute happens
   * it's set properly.
   * @internal
   */
  async setProcessedTrack(processedTrack?: MediaStreamTrack) {
    // required replacement will happen when video is unmuted
    if (!this.nativeTrack.enabled) {
      this.processedTrack = processedTrack;
      return;
    }
    await this.removeOrReplaceProcessedTrack(processedTrack);
    this.videoHandler.updateSinks();
  }

  /**
   * @internal
   * sent track id will be different in case there was some processing done using plugins.
   * replace track is used to, start sending data from a new track without un publishing the prior one. There
   * are thus two track ids - the one which was initially published and should be unpublished when required.
   * The one whose data is currently being sent, which will be used when removing from connection senders.
   */
  getTrackIDBeingSent() {
    return this.getTrackBeingSent().id;
  }

  getTrackBeingSent() {
    return this.enabled ? this.processedTrack || this.nativeTrack : this.nativeTrack;
  }

  /**
   * will change the facingMode to environment if current facing mode is user or vice versa.
   * will be useful when on mobile web to toggle between front and back camera's
   */
  async switchCamera() {
    const currentFacingMode = this.getMediaTrackSettings().facingMode;
    if (!currentFacingMode || this.source !== 'regular') {
      HMSLogger.d(this.TAG, 'facingMode not supported');
      return;
    }
    const facingMode = currentFacingMode === HMSFacingMode.ENVIRONMENT ? HMSFacingMode.USER : HMSFacingMode.ENVIRONMENT;
    this.nativeTrack?.stop();
    const track = await this.replaceTrackWith(this.buildNewSettings({ facingMode: facingMode, deviceId: undefined }));
    await this.replaceSender(track, this.enabled);
    this.nativeTrack = track;
    await this.processPlugins();
    this.videoHandler.updateSinks();
    this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId, facingMode });
    DeviceStorageManager.updateSelection('videoInput', {
      deviceId: this.settings.deviceId,
      groupId: this.nativeTrack.getSettings().groupId,
    });
  }

  /**
   * called when the video is unmuted
   * @private
   */
  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const prevTrack = this.nativeTrack;
    /**
     * not stopping previous track results in device in use more frequently, as many devices will not allow even if
     * you are requesting for a new device.
     * Note: Do not change the order of this.
     */
    this.removeTrackEventListeners(prevTrack);
    prevTrack?.stop();
    try {
      const newTrack = await getVideoTrack(settings);
      this.addTrackEventListeners(newTrack);
      HMSLogger.d(this.TAG, 'replaceTrack, Previous track stopped', prevTrack, 'newTrack', newTrack);
      // Replace deviceId with actual deviceId when it is default
      if (this.settings.deviceId === 'default') {
        this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId });
      }
      return newTrack;
    } catch (error) {
      // Generate a new track from previous settings so there won't be blank tile because previous track is stopped
      const track = await getVideoTrack(this.settings);
      this.addTrackEventListeners(track);
      await this.replaceSender(track, this.enabled);
      this.nativeTrack = track;
      await this.processPlugins();
      this.videoHandler.updateSinks();
      if (this.isPublished) {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.publish({
            error: error as Error,
          }),
        );
      }
      throw error;
    }
  }

  /**
   * called when the video is muted. A blank track is used to replace the original track. This is in order to
   * turn off the camera light and keep the bytes flowing to avoid av sync, timestamp issues.
   * @private
   */
  private async replaceTrackWithBlank() {
    const prevTrack = this.nativeTrack;
    const newTrack = LocalTrackManager.getEmptyVideoTrack(prevTrack);
    this.removeTrackEventListeners(prevTrack);
    this.addTrackEventListeners(newTrack);
    prevTrack?.stop();
    HMSLogger.d(this.TAG, 'replaceTrackWithBlank, Previous track stopped', prevTrack, 'newTrack', newTrack);
    return newTrack;
  }

  private async replaceSender(newTrack: MediaStreamTrack, enabled: boolean) {
    if (enabled) {
      await this.replaceSenderTrack(this.processedTrack || newTrack);
    } else {
      await this.replaceSenderTrack(newTrack);
    }
    const localStream = this.stream as HMSLocalStream;
    localStream.replaceStreamTrack(this.nativeTrack, newTrack);
  }

  private replaceSenderTrack = async (track: MediaStreamTrack) => {
    if (!this.transceiver || this.transceiver.direction !== 'sendonly') {
      HMSLogger.d(this.TAG, `transceiver for ${this.trackId} not available or not connected yet`);
      return;
    }
    await this.transceiver.sender.replaceTrack(track);
  };

  private buildNewSettings = (settings: Partial<HMSVideoTrackSettings>) => {
    const { width, height, codec, maxFramerate, maxBitrate, deviceId, advanced, facingMode } = {
      ...this.settings,
      ...settings,
    };
    const newSettings = new HMSVideoTrackSettings(
      width,
      height,
      codec,
      maxFramerate,
      deviceId,
      advanced,
      maxBitrate,
      facingMode,
    );
    return newSettings;
  };

  // eslint-disable-next-line complexity
  private handleSettingsChange = async (settings: HMSVideoTrackSettings) => {
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);
    if (hasPropertyChanged('maxBitrate') && settings.maxBitrate) {
      await stream.setMaxBitrateAndFramerate(this);
    }
    if (hasPropertyChanged('width') || hasPropertyChanged('height') || hasPropertyChanged('advanced')) {
      if (this.source === 'video') {
        const track = await this.replaceTrackWith(settings);
        await this.replaceSender(track, this.enabled);
        this.nativeTrack = track;
        await this.processPlugins();
        this.videoHandler.updateSinks();
      } else {
        await this.nativeTrack.applyConstraints(settings.toConstraints());
      }
    }
  };

  /**
   * Replace video track with new track on device change
   * @param settings - VideoSettings Object constructed with new settings
   * @param internal - whether the change was because of internal sdk call or external client call
   */
  private handleDeviceChange = async (settings: HMSVideoTrackSettings, internal = false) => {
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId') && this.source === 'regular') {
      if (this.enabled) {
        delete settings.facingMode;
        const track = await this.replaceTrackWith(settings);
        await this.replaceSender(track, this.enabled);
        this.nativeTrack = track;
        await this.processPlugins();
        this.videoHandler.updateSinks();
      }
      const groupId = this.nativeTrack.getSettings().groupId;
      if (!internal && settings.deviceId) {
        DeviceStorageManager.updateSelection('videoInput', {
          deviceId: settings.deviceId,
          groupId,
        });
        this.eventBus.deviceChange.publish({
          isUserSelection: true,
          type: 'video',
          selection: {
            deviceId: settings.deviceId,
            groupId: groupId,
          },
        });
      }
    }
  };

  private addTrackEventListeners(track: MediaStreamTrack) {
    track.addEventListener('mute', this.handleTrackMute);
    track.addEventListener('unmute', this.handleTrackUnmuteNatively);
  }

  private removeTrackEventListeners(track: MediaStreamTrack) {
    track.removeEventListener('mute', this.handleTrackMute);
    track.removeEventListener('unmute', this.handleTrackUnmuteNatively);
  }

  private trackPermissions = () => {
    listenToPermissionChange('camera', (state: PermissionState) => {
      this.eventBus.analytics.publish(AnalyticsEventFactory.permissionChange(this.type, state));
      if (state === 'denied') {
        this.eventBus.localVideoEnabled.publish({ enabled: false, track: this });
      }
    });
  };

  private handleTrackMute = () => {
    HMSLogger.d(this.TAG, 'muted natively', document.visibilityState);
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';
    this.eventBus.analytics.publish(
      this.sendInterruptionEvent({
        started: true,
        reason: reason,
      }),
    );
    this.eventBus.localVideoEnabled.publish({ enabled: false, track: this });
  };

  /** @internal */
  handleTrackUnmuteNatively = async () => {
    HMSLogger.d(this.TAG, 'unmuted natively');
    const reason = document.visibilityState === 'hidden' ? 'visibility-change' : 'incoming-call';

    this.eventBus.analytics.publish(
      this.sendInterruptionEvent({
        started: false,
        reason: reason,
      }),
    );
    this.handleTrackUnmute();
    this.eventBus.localVideoEnabled.publish({ enabled: this.enabled, track: this });
    this.eventBus.localVideoUnmutedNatively.publish();
    await this.setEnabled(this.enabled);
  };

  /**
   * This will either remove or update the processedTrack value on the class instance.
   * It will also replace sender if the processedTrack is updated
   * @param {MediaStreamTrack|undefined}processedTrack
   */
  private removeOrReplaceProcessedTrack = async (processedTrack?: MediaStreamTrack) => {
    // if all plugins are removed reset everything back to native track
    if (!processedTrack) {
      this.processedTrack = undefined;
    } else if (processedTrack !== this.processedTrack) {
      this.processedTrack = processedTrack;
    }
    await this.replaceSenderTrack(this.processedTrack || this.nativeTrack);
  };

  // eslint-disable-next-line complexity
  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'hidden') {
      this.enabledStateBeforeBackground = this.enabled;
      if (this.enabled) {
        await this.setEnabled(false);
      }
      // started interruption event
      this.eventBus.analytics.publish(
        this.sendInterruptionEvent({
          started: true,
          reason: 'visibility-change',
        }),
      );
    } else {
      HMSLogger.d(this.TAG, 'visibility visible, restoring track state', this.enabledStateBeforeBackground);
      if (this.enabledStateBeforeBackground) {
        try {
          await this.setEnabled(true);
        } catch (error) {
          this.eventBus.error.publish(error as HMSException);
        }
      }
      // ended interruption event
      this.eventBus.analytics.publish(
        this.sendInterruptionEvent({
          started: false,
          reason: 'visibility-change',
        }),
      );
    }
  };
}
