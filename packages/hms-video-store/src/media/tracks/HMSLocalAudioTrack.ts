import isEqual from 'lodash.isequal';
import { HMSAudioTrack } from './HMSAudioTrack';
import AnalyticsEventFactory from '../../analytics/AnalyticsEventFactory';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { ErrorCodes } from '../../error/ErrorCodes';
import { HMSException } from '../../error/HMSException';
import { EventBus } from '../../events/EventBus';
import { HMSAudioTrackSettings as IHMSAudioTrackSettings } from '../../interfaces';
import { HMSAudioPlugin, HMSPluginSupportResult } from '../../plugins';
import { HMSAudioPluginsManager } from '../../plugins/audio';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import Room from '../../sdk/models/HMSRoom';
import HMSLogger from '../../utils/logger';
import { HMSAudioContextHandler } from '../../utils/media';
import { isMobile } from '../../utils/support';
import { getAudioTrack, isEmptyTrack, listenToPermissionChange } from '../../utils/track';
import { TrackAudioLevelMonitor } from '../../utils/track-audio-level-monitor';
import { HMSAudioTrackSettings, HMSAudioTrackSettingsBuilder } from '../settings';
import { HMSLocalStream } from '../streams';

function generateHasPropertyChanged(newSettings: Partial<HMSAudioTrackSettings>, oldSettings: HMSAudioTrackSettings) {
  return function hasChanged(prop: 'codec' | 'volume' | 'maxBitrate' | 'deviceId' | 'advanced' | 'audioMode') {
    return !isEqual(newSettings[prop], oldSettings[prop]);
  };
}

export class HMSLocalAudioTrack extends HMSAudioTrack {
  private readonly TAG = '[HMSLocalAudioTrack]';
  settings: HMSAudioTrackSettings;
  private pluginsManager: HMSAudioPluginsManager;
  private processedTrack?: MediaStreamTrack;
  private manuallySelectedDeviceId?: string;
  /**
   * This is to keep track of all the tracks created so far and stop and clear them when creating new tracks to release microphone
   * This is needed because when replaceTrackWith is called before updating native track, there is no way that track is available
   * for you to stop, which leads to the microphone not released even after leave is called.
   */
  private tracksCreated = new Set<MediaStreamTrack>();

  private permissionState?: PermissionState;
  /**
   * Set when the OS or another app takes the mic - an incoming call, a native voip app, or safari
   * being backgrounded on iOS. The native track flags cannot be trusted once that has happened:
   * iOS hands back a track that reports live and unmuted while its capture unit stays stopped, so
   * recovery is driven off this instead of shouldReacquireTrack alone.
   */
  private interrupted = false;
  /** whether the app has been told about an interruption, keeps the start/end pair intact */
  private interruptionNotified = false;
  /** in flight interruption recovery, see endInterruption */
  private recovery?: Promise<void>;
  audioLevelMonitor?: TrackAudioLevelMonitor;

  /**
   * see the doc in HMSLocalVideoTrack
   * @internal
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
    settings: HMSAudioTrackSettings = new HMSAudioTrackSettingsBuilder().build(),
    private room?: Room,
  ) {
    super(stream, track, source);
    stream.tracks.push(this);
    this.addTrackEventListeners(track);
    this.trackPermissions();

    this.settings = settings;
    // Replace the 'default' or invalid deviceId with the actual deviceId
    // This is to maintain consistency with selected devices as in some cases there will be no 'default' device
    if (settings.deviceId !== track.getSettings().deviceId && !isEmptyTrack(track)) {
      this.settings = this.buildNewSettings({ deviceId: track.getSettings().deviceId });
    }
    this.pluginsManager = new HMSAudioPluginsManager(this, eventBus, room);
    this.setFirstTrackId(track.id);
    if (source === 'regular') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  clone(stream: HMSLocalStream) {
    const clonedTrack = this.nativeTrack.clone();
    /**
     * stream only becomes active when the track is added to it.
     */
    stream.nativeStream.addTrack(clonedTrack);
    const track = new HMSLocalAudioTrack(stream, clonedTrack, this.source!, this.eventBus, this.settings, this.room);
    track.peerId = this.peerId;

    if (this.pluginsManager.pluginsMap.size > 0) {
      this.pluginsManager.pluginsMap.forEach(value => {
        track
          .addPlugin(value)
          .catch((e: Error) => HMSLogger.e(this.TAG, 'Plugin add failed while migrating', value, e));
      });
    }
    return track;
  }

  getManuallySelectedDeviceId() {
    return this.manuallySelectedDeviceId;
  }

  resetManuallySelectedDeviceId() {
    this.manuallySelectedDeviceId = undefined;
  }

  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'hidden') {
      this.handleBackgrounded();
      return;
    }
    await this.handleForegrounded();
  };

  private handleForegrounded = async () => {
    HMSLogger.d(this.TAG, `visibility: visible, interrupted: ${this.interrupted}`, `${this}`);
    // an interruption we know about has to be ended even when the track looks healthy, the flags
    // lie after an iOS interruption
    if (!this.interrupted && !this.shouldReacquireTrack()) {
      return;
    }
    this.sendInterruptionAnalytics({ started: false, reason: 'visibility-change' });
    if (this.permissionState && this.permissionState !== 'granted') {
      HMSLogger.d(this.TAG, 'On visibile not replacing track as permission is not granted');
      // the mic cannot come back without the permission, and the page is visible - prompt now
      this.interrupted = true;
      this.notifyInterruption({ started: true, reason: 'permission-not-granted' });
      return;
    }
    try {
      await this.endInterruption('visibility-change');
    } catch (error) {
      this.eventBus.error.publish(error as HMSException);
    }
    this.notifyIfStillInterrupted('visibility-change');
  };

  /**
   * The mic did not come back, and the user is now here to see it. `interrupted` is cleared only once
   * the track has actually been replaced, so it - and not the native flags, which lie after an iOS
   * interruption - is what says whether recovery worked.
   */
  private notifyIfStillInterrupted(reason: string) {
    if (this.interrupted) {
      this.notifyInterruption({ started: true, reason });
    }
  }

  private handleBackgrounded() {
    // track state is fine do nothing
    if (!this.shouldReacquireTrack()) {
      HMSLogger.d(this.TAG, 'visibility: hidden', `${this}`);
      return;
    }
    this.interrupted = true;
    this.sendInterruptionAnalytics({ started: true, reason: 'visibility-change' });
    this.notifyInterruption({ started: true, reason: 'visibility-change' });
  }

  /**
   * Interruption end. Both triggers - the native unmute and coming back to the foreground - have to
   * do the same three things:
   * 1. get a track that actually captures. Only a fresh getUserMedia is reliable here, the
   *    interrupted track can report live and unmuted and still produce nothing.
   * 2. re-publish the enabled state. On interruption start biz is told mute=true, on which every
   *    remote peer unsubscribes from this peer's audio - they resubscribe only on the next update.
   * 3. resume the remote playback the OS paused along with capture.
   */
  private endInterruption = async (reason: string) => {
    /**
     * Only mobile defers. iOS does not give capture back to a backgrounded tab, and
     * handleVisibilityChange retries on return. On desktop a hidden page is just another tab and
     * getUserMedia works there, so deferring would leave the mic dead - and the peer published as
     * muted - until the user happens to come back to the tab.
     */
    if (isMobile() && document.visibilityState === 'hidden') {
      HMSLogger.d(this.TAG, 'interruption ended while hidden, deferring recovery', reason, `${this}`);
      return;
    }
    /**
     * both triggers fire on returning from an iOS interruption, and a second replaceTrackWith would
     * stop the track the first one just installed. First trigger wins; the loser waits for it so
     * that whatever runs after this sees the finished state rather than a half-replaced track.
     */
    if (this.recovery) {
      HMSLogger.d(this.TAG, 'interruption recovery already in progress', reason, `${this}`);
      await this.recovery.catch(() => {
        // the trigger that started the recovery reports its own failure
      });
      return;
    }
    this.recovery = this.restoreCapture(reason);
    try {
      await this.recovery;
    } finally {
      this.recovery = undefined;
    }
  };

  private restoreCapture = async (reason: string) => {
    /**
     * iOS suspends the shared AudioContext for the duration of the interruption and does not resume
     * it on its own. Plugins publish the destination node of that context, so with noise
     * suppression on the published track stays silent until it is running again, and the audio level
     * monitor reads zero. It is only resumed on join and on unblockAutoplay otherwise.
     */
    await HMSAudioContextHandler.resumeContext();
    await this.reacquireStaleTrack(reason);
    await this.setEnabled(this.enabled, true);
    this.notifyInterruption({ started: false, reason });
    // whatsapp call doesn't seem to send video unmute natively, so use audio unmute to play video
    this.eventBus.localAudioUnmutedNatively.publish();
  };

  /**
   * Replace the new track in stream and update native track
   * @param track
   */
  private async updateTrack(track: MediaStreamTrack) {
    track.enabled = this.enabled;
    const localStream = this.stream as HMSLocalStream;
    await localStream.replaceStreamTrack(this.nativeTrack, track);
    // change nativeTrack so plugin can start its work
    this.nativeTrack = track;
    await this.replaceSenderTrack();
    const isLevelMonitored = Boolean(this.audioLevelMonitor);
    isLevelMonitored && this.initAudioLevelMonitor();
  }

  private async replaceTrackWith(settings: HMSAudioTrackSettings) {
    const prevTrack = this.nativeTrack;
    /*
     * Note: Do not change the order of this.
     * stop the previous before acquiring the new track otherwise this can lead to
     * no audio when the above getAudioTrack throws an error. ex: DeviceInUse error
     */
    prevTrack?.stop();
    this.removeTrackEventListeners(prevTrack);
    this.tracksCreated.forEach(track => track.stop());
    this.tracksCreated.clear();
    try {
      const newTrack = await getAudioTrack(settings);
      this.addTrackEventListeners(newTrack);
      this.tracksCreated.add(newTrack);
      // Send analytics event with constraints and resulting track settings
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.mediaConstraints({
          requestedConstraints: { audio: settings.toConstraints() },
          appliedConstraints: { audio: newTrack.getConstraints() },
          trackSettings: { audio: newTrack.getSettings() },
        }),
      );
      HMSLogger.d(this.TAG, 'replaceTrack, Previous track stopped', prevTrack, 'newTrack', newTrack);
      await this.updateTrack(newTrack);
    } catch (e) {
      const error = e as HMSException;

      if (
        error.code === ErrorCodes.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE ||
        error.code === ErrorCodes.TracksErrors.SYSTEM_DENIED_PERMISSION
      ) {
        const newTrack = await LocalTrackManager.getEmptyAudioTrack();
        this.addTrackEventListeners(newTrack);
        this.tracksCreated.add(newTrack);
        await this.updateTrack(newTrack);
        throw error;
      }
      // Generate a new track from previous settings so there will be audio because previous track is stopped
      const newTrack = await getAudioTrack(this.settings);
      this.addTrackEventListeners(newTrack);
      this.tracksCreated.add(newTrack);
      // Send analytics event with constraints and resulting track settings
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.mediaConstraints({
          requestedConstraints: { audio: this.settings.toConstraints() },
          appliedConstraints: { audio: newTrack.getConstraints() },
          trackSettings: { audio: newTrack.getSettings() },
        }),
      );
      await this.updateTrack(newTrack);
      if (this.isPublished) {
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.publish({
            error: e as Error,
          }),
        );
      }
      throw e;
    }
    try {
      await this.pluginsManager.reprocessPlugins();
    } catch (e) {
      this.eventBus.audioPluginFailed.publish(e as HMSException);
    }
  }

  async setEnabled(value: boolean, skipcheck = false) {
    if (value === this.enabled && !skipcheck) {
      return;
    }
    // Replace silent empty track or muted track(happens when microphone is disabled from address bar in iOS) with an actual audio track, if enabled or ended track or when silence is detected.
    if (value) {
      await this.reacquireStaleTrack('set-enabled');
    }
    await super.setEnabled(value);
    if (value) {
      this.settings = this.buildNewSettings({ deviceId: this.nativeTrack.getSettings().deviceId });
    }
    this.eventBus.localAudioEnabled.publish({ enabled: value, track: this });
  }

  /**
   * verify if the track id being passed is of this track for correlating server messages like audio level
   */
  isPublishedTrackId(trackId: string) {
    return this.publishedTrackId === trackId;
  }

  async setSettings(settings: Partial<IHMSAudioTrackSettings>, internal = false) {
    const newSettings = this.buildNewSettings(settings);

    if (isEmptyTrack(this.nativeTrack)) {
      // if it is an empty track, cache the settings for when it is unmuted
      this.settings = newSettings;
      return;
    }
    await this.handleDeviceChange(newSettings, internal);
    await this.handleSettingsChange(newSettings);
    this.settings = newSettings;
  }

  /**
   * @see HMSAudioPlugin
   */
  getPlugins(): string[] {
    return this.pluginsManager.getPlugins();
  }

  /**
   * @see HMSAudioPlugin
   */
  async addPlugin(plugin: HMSAudioPlugin): Promise<void> {
    return this.pluginsManager.addPlugin(plugin);
  }

  /**
   * @see HMSAudioPlugin
   */
  async removePlugin(plugin: HMSAudioPlugin): Promise<void> {
    return this.pluginsManager.removePlugin(plugin);
  }

  /**
   * @see HMSAudioPlugin
   */
  validatePlugin(plugin: HMSAudioPlugin): HMSPluginSupportResult {
    return this.pluginsManager.validatePlugin(plugin);
  }

  /**
   * @internal
   */
  async setProcessedTrack(processedTrack?: MediaStreamTrack) {
    // if all plugins are removed reset everything back to native track
    if (!processedTrack) {
      this.processedTrack = undefined;
    } else if (processedTrack !== this.processedTrack) {
      this.processedTrack = processedTrack;
    }
    await this.replaceSenderTrack();
  }

  initAudioLevelMonitor() {
    if (this.audioLevelMonitor) {
      this.destroyAudioLevelMonitor();
    }
    HMSLogger.d(this.TAG, 'Monitor Audio Level for', this, this.getMediaTrackSettings().deviceId);
    this.audioLevelMonitor = new TrackAudioLevelMonitor(
      this,
      this.eventBus.trackAudioLevelUpdate,
      this.eventBus.localAudioSilence,
    );
    this.audioLevelMonitor.start();
    this.audioLevelMonitor.detectSilence();
  }

  destroyAudioLevelMonitor() {
    this.audioLevelMonitor?.stop();
    this.audioLevelMonitor = undefined;
  }

  async cleanup() {
    super.cleanup();
    await this.pluginsManager.cleanup();
    await this.pluginsManager.closeContext();
    this.transceiver = undefined;
    this.processedTrack?.stop();
    this.tracksCreated.forEach(track => track.stop());
    this.tracksCreated.clear();
    this.isPublished = false;
    this.destroyAudioLevelMonitor();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * @internal
   * published track id will be different in case there was some processing done using plugins.
   */
  getTrackIDBeingSent() {
    return this.processedTrack ? this.processedTrack.id : this.nativeTrack.id;
  }

  /**
   * @internal
   */
  getTrackBeingSent() {
    return this.processedTrack || this.nativeTrack;
  }

  private addTrackEventListeners(track: MediaStreamTrack) {
    track.addEventListener('mute', this.handleTrackMute);
    track.addEventListener('unmute', this.handleTrackUnmute);
  }

  private removeTrackEventListeners(track: MediaStreamTrack) {
    track.removeEventListener('mute', this.handleTrackMute);
    track.removeEventListener('unmute', this.handleTrackUnmute);
  }

  private trackPermissions = () => {
    listenToPermissionChange('microphone', (state: PermissionState) => {
      this.permissionState = state;
      this.eventBus.analytics.publish(AnalyticsEventFactory.permissionChange(this.type, state));
      if (state === 'denied') {
        this.eventBus.localAudioEnabled.publish({ enabled: false, track: this });
      }
    });
  };

  private sendInterruptionAnalytics({ started, reason }: { started: boolean; reason: string }) {
    this.eventBus.analytics.publish(this.sendInterruptionEvent({ started, reason }));
  }

  /**
   * app facing interruption event, for a mic that is actually not capturing and a user who is there
   * to see it. Two things it deliberately stays quiet about:
   *
   * - a hidden page. Backgrounding is not an interruption to prompt about even when the OS does stop
   *   the mic, because the mic is reacquired on the way back. If it does not come back,
   *   handleForegrounded raises it once the page is visible, which is the first moment a prompt is
   *   worth anything.
   * - an unpaired event. An end is only published after the mic has actually recovered, so a prompt
   *   stays up while the mic is still unusable, and never for a start that was never published.
   *
   * The analytics events are not gated with it - interruption.start/stop record every interruption,
   * including the ones the user never had to hear about.
   */
  private notifyInterruption({ started, reason }: { started: boolean; reason: string }) {
    if (started === this.interruptionNotified) {
      return;
    }
    if (started && document.visibilityState === 'hidden') {
      return;
    }
    this.interruptionNotified = started;
    this.eventBus.trackInterruption.publish({ started, reason, type: this.type, trackId: this.trackId });
  }

  private handleTrackMute = () => {
    HMSLogger.d(this.TAG, 'muted natively', `${this}`);
    this.interrupted = true;
    this.sendInterruptionAnalytics({ started: true, reason: 'track-muted-natively' });
    this.notifyInterruption({ started: true, reason: 'track-muted-natively' });
    this.eventBus.localAudioEnabled.publish({ enabled: false, track: this });
  };

  /** @internal */
  handleTrackUnmute = async () => {
    HMSLogger.d(this.TAG, 'unmuted natively', `${this}`);
    this.sendInterruptionAnalytics({ started: false, reason: 'track-unmuted-natively' });
    try {
      await this.endInterruption('track-unmuted-natively');
    } catch (error) {
      this.eventBus.error.publish(error as HMSException);
    }
  };

  /**
   * A track that went through an interruption has to be replaced even when it reports live and
   * unmuted - see `interrupted`.
   */
  private reacquireStaleTrack = async (reason: string) => {
    if (!this.interrupted && !this.shouldReacquireTrack()) {
      return;
    }
    HMSLogger.d(this.TAG, 'reacquiring track', reason, `${this}`);
    await this.replaceTrackWith(this.settings);
    this.interrupted = false;
    /**
     * Capture is back, so the interruption is over however we got here. Publishing from this point
     * rather than only from restoreCapture keeps the app in step when the user recovers the mic
     * themselves - unmuting runs setEnabled, which lands here and nowhere near restoreCapture.
     */
    this.notifyInterruption({ started: false, reason });
  };

  private replaceSenderTrack = async () => {
    if (!this.transceiver || this.transceiver.direction !== 'sendonly') {
      HMSLogger.d(this.TAG, `transceiver for ${this.trackId} not available or not connected yet`);
      return;
    }
    await this.transceiver.sender.replaceTrack(this.processedTrack || this.nativeTrack);
  };

  private shouldReacquireTrack = () => {
    return isEmptyTrack(this.nativeTrack) || this.isTrackNotPublishing();
  };

  private buildNewSettings(settings: Partial<HMSAudioTrackSettings>) {
    const { volume, codec, maxBitrate, deviceId, advanced, audioMode } = { ...this.settings, ...settings };
    const newSettings = new HMSAudioTrackSettings(volume, codec, maxBitrate, deviceId, advanced, audioMode);
    return newSettings;
  }

  private handleSettingsChange = async (settings: HMSAudioTrackSettings) => {
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);
    if ((hasPropertyChanged('maxBitrate') || hasPropertyChanged('audioMode')) && settings.maxBitrate) {
      await stream.setMaxBitrateAndFramerate(this, settings);
    }

    if (hasPropertyChanged('advanced') || hasPropertyChanged('audioMode')) {
      await this.replaceTrackWith(settings);
    }
  };

  /**
   * Replace audio track with new track on device change if enabled
   * @param settings - AudioSettings Object constructed with new settings
   * @param internal - whether the change was because of internal sdk call or external client call
   */
  private handleDeviceChange = async (settings: HMSAudioTrackSettings, internal = false) => {
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);
    if (hasPropertyChanged('deviceId')) {
      this.manuallySelectedDeviceId = !internal ? settings.deviceId : this.manuallySelectedDeviceId;
      HMSLogger.d(
        this.TAG,
        'device change',
        'manual selection:',
        this.manuallySelectedDeviceId,
        'new device:',
        settings.deviceId,
      );
      await this.replaceTrackWith(settings);
      const groupId = this.nativeTrack.getSettings().groupId;
      if (!internal && settings.deviceId) {
        DeviceStorageManager.updateSelection('audioInput', {
          deviceId: settings.deviceId,
          groupId,
        });
        this.eventBus.deviceChange.publish({
          isUserSelection: true,
          type: 'audioInput',
          selection: {
            deviceId: settings.deviceId,
            groupId: groupId,
            label: this.nativeTrack.label,
          },
        });
      }
    }
  };
}
