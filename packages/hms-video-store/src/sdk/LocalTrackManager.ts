import { v4 as uuid } from 'uuid';
import { Store } from './store';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AnalyticsTimer, TimedEvent } from '../analytics/AnalyticsTimer';
import { DeviceManager } from '../device-manager';
import { ErrorCodes } from '../error/ErrorCodes';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { BuildGetMediaError, HMSGetMediaActions } from '../error/utils';
import { EventBus } from '../events/EventBus';
import { HMSAudioCodec, HMSScreenShareConfig, HMSVideoCodec, ScreenCaptureHandleConfig } from '../interfaces';
import InitialSettings from '../interfaces/settings';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack, HMSTrackType } from '../internal';
import {
  HMSAudioTrackSettings,
  HMSAudioTrackSettingsBuilder,
  HMSTrackSettings,
  HMSTrackSettingsBuilder,
  HMSVideoTrackSettings,
  HMSVideoTrackSettingsBuilder,
} from '../media/settings';
import { HMSLocalStream } from '../media/streams/HMSLocalStream';
import ITransportObserver from '../transport/ITransportObserver';
import HMSLogger from '../utils/logger';
import { HMSAudioContextHandler } from '../utils/media';

const defaultSettings = {
  isAudioMuted: false,
  isVideoMuted: false,
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',
  videoDeviceId: 'default',
};
type IFetchTrackOptions = boolean | 'empty';
interface IFetchAVTrackOptions {
  audio: IFetchTrackOptions;
  video: IFetchTrackOptions;
}

let blankCanvas: HTMLCanvasElement | undefined;
let intervalID: ReturnType<typeof setInterval> | undefined;

export class LocalTrackManager {
  readonly TAG: string = '[LocalTrackManager]';
  private captureHandleIdentifier?: string;

  constructor(
    private store: Store,
    private observer: ITransportObserver,
    private deviceManager: DeviceManager,
    private eventBus: EventBus,
    private analyticsTimer: AnalyticsTimer,
  ) {
    this.setScreenCaptureHandleConfig();
  }

  // eslint-disable-next-line complexity
  async getTracksToPublish(initialSettings: InitialSettings = defaultSettings): Promise<HMSLocalTrack[]> {
    const trackSettings = this.getAVTrackSettings(initialSettings);
    if (!trackSettings) {
      return [];
    }
    const canPublishAudio = !!trackSettings.audio;
    const canPublishVideo = !!trackSettings.video;
    let tracksToPublish: Array<HMSLocalTrack> = [];
    const { videoTrack, audioTrack } = await this.updateCurrentLocalTrackSettings(trackSettings);
    const localStream = (videoTrack?.stream || audioTrack?.stream) as HMSLocalStream | undefined;
    // The track gets added to the store only after it is published.
    const isVideoTrackPublished = Boolean(videoTrack && this.store.getTrackById(videoTrack.trackId));
    const isAudioTrackPublished = Boolean(audioTrack && this.store.getTrackById(audioTrack.trackId));

    if (isVideoTrackPublished && isAudioTrackPublished) {
      // there is nothing to publish
      return [];
    }

    const fetchTrackOptions: IFetchAVTrackOptions = {
      audio: canPublishAudio && !audioTrack && (initialSettings.isAudioMuted ? 'empty' : true),
      video: canPublishVideo && !videoTrack && (initialSettings.isVideoMuted ? 'empty' : true),
    };

    if (fetchTrackOptions.audio) {
      this.analyticsTimer.start(TimedEvent.LOCAL_AUDIO_TRACK);
    }
    if (fetchTrackOptions.video) {
      this.analyticsTimer.start(TimedEvent.LOCAL_VIDEO_TRACK);
    }
    try {
      HMSLogger.d(this.TAG, 'Init Local Tracks', { fetchTrackOptions });
      tracksToPublish = await this.getLocalTracks(fetchTrackOptions, trackSettings, localStream);
    } catch (error) {
      tracksToPublish = await this.retryGetLocalTracks(
        error as HMSException,
        trackSettings,
        fetchTrackOptions,
        localStream,
      );
    }
    if (fetchTrackOptions.audio) {
      this.analyticsTimer.end(TimedEvent.LOCAL_AUDIO_TRACK);
    }
    if (fetchTrackOptions.video) {
      this.analyticsTimer.end(TimedEvent.LOCAL_VIDEO_TRACK);
    }

    if (videoTrack && canPublishVideo && !isVideoTrackPublished) {
      tracksToPublish.push(videoTrack);
    }
    if (audioTrack && canPublishAudio && !isAudioTrackPublished) {
      tracksToPublish.push(audioTrack);
    }
    return tracksToPublish;
  }

  /**
   * @throws {HMSException}
   */
  async getLocalTracks(
    fetchTrackOptions: IFetchAVTrackOptions = { audio: true, video: true },
    settings: HMSTrackSettings,
    localStream?: HMSLocalStream,
  ): Promise<Array<HMSLocalTrack>> {
    try {
      const nativeTracks = await this.getNativeLocalTracks(fetchTrackOptions, settings);
      return this.createHMSLocalTracks(nativeTracks, settings, localStream);
    } catch (error) {
      // TOOD: On OverConstrained error, retry with dropping all constraints.
      // Just retry getusermedia again - it sometimes work when AbortError or NotFoundError is thrown on a few devices
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.publish({
          devices: this.deviceManager.getDevices(),
          error: error as Error,
          settings,
        }),
      );
      throw error;
    }
  }

  /**
   * @throws {HMSException}
   */
  private async getNativeLocalTracks(
    fetchTrackOptions: IFetchAVTrackOptions = { audio: false, video: false },
    settings: HMSTrackSettings,
  ) {
    const trackSettings = new HMSTrackSettings(
      fetchTrackOptions.video === true ? settings.video : null,
      fetchTrackOptions.audio === true ? settings.audio : null,
      settings.simulcast,
    );
    const nativeTracks: MediaStreamTrack[] = [];

    if (trackSettings.audio || trackSettings.video) {
      nativeTracks.push(...(await this.getAVTracks(trackSettings)));
    }
    nativeTracks.push(...this.getEmptyTracks(fetchTrackOptions));
    return nativeTracks;
  }
  private async optimizeScreenShareConstraint(stream: MediaStream, constraints: MediaStreamConstraints) {
    if (typeof constraints.video === 'boolean' || !constraints.video?.width || !constraints.video?.height) {
      return;
    }
    const publishParams = this.store.getPublishParams();
    if (!publishParams || !publishParams.allowed?.includes('screen')) {
      return;
    }
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.addEventListener('loadedmetadata', async () => {
      const { videoWidth, videoHeight } = videoElement;
      const screen = publishParams.screen;
      const pixels = screen.width * screen.height;
      const actualAspectRatio = videoWidth / videoHeight;
      const currentAspectRatio = screen.width / screen.height;
      if (actualAspectRatio > currentAspectRatio) {
        const videoConstraint = constraints.video as MediaTrackConstraints;
        const ratio = actualAspectRatio / currentAspectRatio;
        const sqrt_ratio = Math.sqrt(ratio);
        if (videoWidth * videoHeight > pixels) {
          videoConstraint.width = videoWidth / sqrt_ratio;
          videoConstraint.height = videoHeight / sqrt_ratio;
        } else {
          videoConstraint.height = videoHeight * sqrt_ratio;
          videoConstraint.width = videoWidth * sqrt_ratio;
        }
        await stream.getVideoTracks()[0].applyConstraints(videoConstraint);
      }
    });
  }
  async getLocalScreen(partialConfig?: HMSScreenShareConfig, optimise = false) {
    const config = await this.getOrDefaultScreenshareConfig(partialConfig);
    const screenSettings = this.getScreenshareSettings(config.videoOnly);
    const constraints = {
      video: { ...screenSettings?.video.toConstraints(true), displaySurface: config.displaySurface },
      preferCurrentTab: config.preferCurrentTab,
      selfBrowserSurface: config.selfBrowserSurface,
      surfaceSwitching: config.surfaceSwitching,
      systemAudio: config.systemAudio,
    } as MediaStreamConstraints;
    if (screenSettings?.audio) {
      const audioConstraints: MediaTrackConstraints = screenSettings?.audio?.toConstraints();
      // remove advanced constraints as it not supported for screenshare audio
      delete audioConstraints.advanced;
      constraints.audio = {
        ...audioConstraints,
        autoGainControl: false,
        noiseSuppression: false,
        // @ts-ignore
        googAutoGainControl: false,
        echoCancellation: false,
      };
    }
    let stream;
    try {
      HMSLogger.d('retrieving screenshare with ', { config }, { constraints });
      // @ts-ignore [https://github.com/microsoft/TypeScript/issues/33232]
      stream = (await navigator.mediaDevices.getDisplayMedia(constraints)) as MediaStream;
      if (optimise) {
        await this.optimizeScreenShareConstraint(stream, constraints);
      }
    } catch (err) {
      HMSLogger.w(this.TAG, 'error in getting screenshare - ', err);
      const error = BuildGetMediaError(err as Error, HMSGetMediaActions.SCREEN);
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.publish({
          error: error as Error,
          devices: this.deviceManager.getDevices(),
          settings: new HMSTrackSettings(screenSettings?.video, screenSettings?.audio, false),
        }),
      );
      throw error;
    }

    const tracks: Array<HMSLocalTrack> = [];
    const local = new HMSLocalStream(stream);
    const nativeVideoTrack = stream.getVideoTracks()[0];
    const videoTrack = new HMSLocalVideoTrack(local, nativeVideoTrack, 'screen', this.eventBus, screenSettings?.video);
    videoTrack.setSimulcastDefinitons(this.store.getSimulcastDefinitionsForPeer(this.store.getLocalPeer()!, 'screen'));

    try {
      const isCurrentTabShared = this.validateCurrentTabCapture(videoTrack, config.forceCurrentTab);
      videoTrack.isCurrentTab = isCurrentTabShared;
      await videoTrack.cropTo(config.cropTarget);
    } catch (err) {
      stream.getTracks().forEach(track => track.stop());
      throw err;
    }

    tracks.push(videoTrack);
    const nativeAudioTrack = stream.getAudioTracks()[0];
    if (nativeAudioTrack) {
      const audioTrack = new HMSLocalAudioTrack(
        local,
        nativeAudioTrack,
        'screen',
        this.eventBus,
        screenSettings?.audio,
      );
      tracks.push(audioTrack);
    }

    HMSLogger.v(this.TAG, 'getLocalScreen', tracks);
    return tracks;
  }

  setScreenCaptureHandleConfig(config?: Partial<ScreenCaptureHandleConfig>) {
    // @ts-ignore
    if (!navigator.mediaDevices?.setCaptureHandleConfig || this.isInIframe()) {
      // setCaptureHandleConfig can't be called from within an iframe
      return;
    }
    config = config || {};
    Object.assign(config, { handle: uuid(), exposeOrigin: false, permittedOrigins: [window.location.origin] });
    HMSLogger.d('setting capture handle - ', config.handle);
    // @ts-ignore
    navigator.mediaDevices.setCaptureHandleConfig(config);
    this.captureHandleIdentifier = config.handle;
  }

  validateCurrentTabCapture(track: HMSLocalVideoTrack, forceCurrentTab: boolean): boolean {
    const trackHandle = track.getCaptureHandle();
    const isCurrentTabShared = !!(this.captureHandleIdentifier && trackHandle?.handle === this.captureHandleIdentifier);
    if (forceCurrentTab && !isCurrentTabShared) {
      HMSLogger.e(this.TAG, 'current tab was not shared with forceCurrentTab as true');
      throw ErrorFactory.TracksErrors.CurrentTabNotShared();
    }
    return isCurrentTabShared;
  }

  async requestPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      HMSLogger.e(this.TAG, error);
    }
  }

  static getEmptyVideoTrack(prevTrack?: MediaStreamTrack): MediaStreamTrack {
    const width = prevTrack?.getSettings()?.width || 320;
    const height = prevTrack?.getSettings()?.height || 240;
    const frameRate = 1; // fps TODO: experiment, see if this can be reduced
    if (!blankCanvas) {
      blankCanvas = document.createElement('canvas');
      blankCanvas.width = width;
      blankCanvas.height = height;
      blankCanvas.getContext('2d')?.fillRect(0, 0, width, height);
    }
    if (!intervalID) {
      // This is needed to send some data so the track is received on sfu
      intervalID = setInterval(() => {
        const ctx = blankCanvas?.getContext('2d');
        if (ctx) {
          ctx.fillRect(0, 0, 1, 1);
        }
      }, 1000 / frameRate);
    }

    const stream = blankCanvas.captureStream(frameRate);
    const emptyTrack = stream.getVideoTracks()[0];
    emptyTrack.enabled = false;
    return emptyTrack;
  }

  static getEmptyAudioTrack(): MediaStreamTrack {
    const ctx = HMSAudioContextHandler.getAudioContext();
    const oscillator = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    const emptyTrack = dst.stream.getAudioTracks()[0];
    emptyTrack.enabled = false;
    return emptyTrack;
  }

  static cleanup() {
    clearInterval(intervalID);
    intervalID = undefined;
    blankCanvas = undefined;
  }

  /**
   * @throws {HMSException}
   */
  private async getAVTracks(settings: HMSTrackSettings): Promise<Array<MediaStreamTrack>> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: settings.audio ? settings.audio.toConstraints() : false,
        video: settings.video ? settings.video.toConstraints() : false,
      });

      return stream.getVideoTracks().concat(stream.getAudioTracks());
    } catch (error) {
      await this.deviceManager.init();
      const videoError = !!(!this.deviceManager.hasWebcamPermission && settings.video);
      const audioError = !!(!this.deviceManager.hasMicrophonePermission && settings.audio);
      /**
       * TODO: Only permission error throws correct device info in error(audio or video or both),
       * Right now for other errors such as overconstrained error we are unable to get whether audio/video failure.
       * Fix this by checking the native error message.
       */
      const errorType = this.getErrorType(videoError, audioError);
      throw BuildGetMediaError(error as Error, errorType);
    }
  }

  private getAVTrackSettings(initialSettings: InitialSettings): HMSTrackSettings | null {
    const audioSettings = this.getAudioSettings(initialSettings);
    const videoSettings = this.getVideoSettings(initialSettings);
    if (!audioSettings && !videoSettings) {
      return null;
    }
    return new HMSTrackSettingsBuilder().video(videoSettings).audio(audioSettings).build();
  }

  private isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // eslint-disable-next-line complexity
  private async retryGetLocalTracks(
    error: HMSException,
    trackSettings: HMSTrackSettings,
    fetchTrackOptions: IFetchAVTrackOptions,
    localStream?: HMSLocalStream,
  ): Promise<Array<HMSLocalTrack>> {
    if (error instanceof HMSException && error.action === HMSAction.TRACK) {
      this.observer.onFailure(error);

      const overConstrainedFailure = error.code === ErrorCodes.TracksErrors.OVER_CONSTRAINED;
      const audioFailure = error.message.includes('audio');
      const videoFailure = error.message.includes('video');
      if (overConstrainedFailure) {
        // TODO: Use this once TODO@L#250 is completed
        // const newTrackSettings = new HMSTrackSettingsBuilder()
        //   .video(videoFailure ? new HMSVideoTrackSettings() : trackSettings.video)
        //   .audio(audioFailure ? new HMSAudioTrackSettings() : trackSettings.audio)
        //   .build();
        const newTrackSettings = new HMSTrackSettingsBuilder()
          .video(new HMSVideoTrackSettings())
          .audio(new HMSAudioTrackSettings())
          .build();

        HMSLogger.w(this.TAG, 'Fetch AV Tracks failed with overconstrained error', { fetchTrackOptions }, { error });

        try {
          // Try get local tracks with no constraints
          return await this.getLocalTracks(fetchTrackOptions, newTrackSettings, localStream);
        } catch (error) {
          /**
           * This error shouldn't be overconstrained error(as we've dropped all constraints).
           * If it's an overconstrained error, change error code to avoid recursive loop
           * Try get local tracks for empty tracks
           */
          const nativeError: Error | undefined = error instanceof HMSException ? error.nativeError : (error as Error);
          let ex = error;
          if (nativeError?.name === 'OverconstrainedError') {
            const newError = ErrorFactory.TracksErrors.GenericTrack(
              HMSAction.TRACK,
              'Overconstrained error after dropping all constraints',
            );
            newError.addNativeError(nativeError);
            ex = newError;
          }

          return await this.retryGetLocalTracks(ex as HMSException, trackSettings, fetchTrackOptions, localStream);
        }
      }

      fetchTrackOptions.audio = audioFailure ? 'empty' : fetchTrackOptions.audio;
      fetchTrackOptions.video = videoFailure ? 'empty' : fetchTrackOptions.video;
      HMSLogger.w(this.TAG, 'Fetch AV Tracks failed', { fetchTrackOptions }, error);
      try {
        return await this.getLocalTracks(fetchTrackOptions, trackSettings, localStream);
      } catch (error) {
        HMSLogger.w(this.TAG, 'Fetch empty tacks failed', error);
        fetchTrackOptions.audio = fetchTrackOptions.audio && 'empty';
        fetchTrackOptions.video = fetchTrackOptions.video && 'empty';
        this.observer.onFailure(error as HMSException);
        return await this.getLocalTracks(fetchTrackOptions, trackSettings, localStream);
      }
    } else {
      HMSLogger.w(this.TAG, 'Fetch AV Tracks failed - unknown exception', error);
      this.observer.onFailure(error);
      return [];
    }
  }

  private getErrorType(videoError: boolean, audioError: boolean): HMSGetMediaActions {
    if (videoError && audioError) {
      return HMSGetMediaActions.AV;
    }
    if (videoError) {
      return HMSGetMediaActions.VIDEO;
    }
    if (audioError) {
      return HMSGetMediaActions.AUDIO;
    }
    return HMSGetMediaActions.UNKNOWN;
  }

  private getEmptyTracks(fetchTrackOptions: IFetchAVTrackOptions) {
    const nativeTracks: MediaStreamTrack[] = [];
    if (fetchTrackOptions.audio === 'empty') {
      nativeTracks.push(LocalTrackManager.getEmptyAudioTrack());
    }

    if (fetchTrackOptions.video === 'empty') {
      nativeTracks.push(LocalTrackManager.getEmptyVideoTrack());
    }
    return nativeTracks;
  }

  private async updateCurrentLocalTrackSettings(trackSettings: HMSTrackSettings | null) {
    const localTracks = this.store.getLocalPeerTracks();
    const videoTrack = localTracks.find(t => t.type === HMSTrackType.VIDEO && t.source === 'regular') as
      | HMSLocalVideoTrack
      | undefined;
    const audioTrack = localTracks.find(t => t.type === HMSTrackType.AUDIO && t.source === 'regular') as
      | HMSLocalAudioTrack
      | undefined;

    const screenVideoTrack = localTracks.find(t => t.type === HMSTrackType.VIDEO && t.source === 'screen') as
      | HMSLocalVideoTrack
      | undefined;

    if (trackSettings?.video) {
      await videoTrack?.setSettings(trackSettings.video);
    }

    if (trackSettings?.audio) {
      await audioTrack?.setSettings(trackSettings.audio);
    }

    const screenSettings = this.getScreenshareSettings(true);
    if (screenSettings?.video) {
      await screenVideoTrack?.setSettings(screenSettings?.video);
    }

    return { videoTrack, audioTrack };
  }

  private getAudioSettings(initialSettings: InitialSettings) {
    const publishParams = this.store.getPublishParams();
    if (!publishParams || !publishParams.allowed?.includes('audio')) {
      return null;
    }
    const localPeer = this.store.getLocalPeer();
    const audioTrack = localPeer?.audioTrack;
    // Get device from the tracks already added in preview
    const audioDeviceId = audioTrack?.settings.deviceId || initialSettings.audioInputDeviceId;

    return new HMSAudioTrackSettingsBuilder()
      .codec(publishParams.audio.codec as HMSAudioCodec)
      .maxBitrate(publishParams.audio.bitRate)
      .deviceId(audioDeviceId || defaultSettings.audioInputDeviceId)
      .build();
  }

  private getVideoSettings(initialSettings: InitialSettings) {
    const publishParams = this.store.getPublishParams();
    if (!publishParams || !publishParams.allowed?.includes('video')) {
      return null;
    }
    const localPeer = this.store.getLocalPeer();
    const videoTrack = localPeer?.videoTrack;
    // Get device from the tracks already added in preview
    const videoDeviceId = videoTrack?.settings.deviceId || initialSettings.videoDeviceId;
    const video = publishParams.video;
    return new HMSVideoTrackSettingsBuilder()
      .codec(video.codec as HMSVideoCodec)
      .maxBitrate(video.bitRate)
      .maxFramerate(video.frameRate)
      .setWidth(video.width) // take simulcast width if available
      .setHeight(video.height) // take simulcast width if available
      .deviceId(videoDeviceId || defaultSettings.videoDeviceId)
      .build();
  }

  private getScreenshareSettings(isVideoOnly = false) {
    const publishParams = this.store.getPublishParams();
    if (!publishParams || !publishParams.allowed?.includes('screen')) {
      return null;
    }
    const screen = publishParams.screen;
    return {
      video: new HMSVideoTrackSettingsBuilder()
        // Don't cap maxBitrate for screenshare.
        // If publish params doesn't have bitRate value - don't set maxBitrate.
        .maxBitrate(screen.bitRate, false)
        .codec(screen.codec as HMSVideoCodec)
        .maxFramerate(screen.frameRate)
        .setWidth(screen.width)
        .setHeight(screen.height)
        .build(),
      audio: isVideoOnly ? undefined : new HMSAudioTrackSettingsBuilder().build(),
    };
  }

  // eslint-disable-next-line complexity
  private async getOrDefaultScreenshareConfig(partialConfig?: Partial<HMSScreenShareConfig>) {
    type RequiredConfig = HMSScreenShareConfig &
      Required<Omit<HMSScreenShareConfig, 'cropTarget' | 'cropElement' | 'displaySurface'>>;
    const config: RequiredConfig = Object.assign(
      {
        videoOnly: false,
        audioOnly: false,
        forceCurrentTab: false,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude', // don't give self tab in options
        surfaceSwitching: 'include', // give option to switch tabs while sharing
        systemAudio: 'exclude', // system audio share leads to echo in windows
        displaySurface: 'monitor',
      },
      partialConfig || {},
    );
    if (config.forceCurrentTab) {
      config.videoOnly = true; // there will be echo otherwise
      config.preferCurrentTab = true;
      config.selfBrowserSurface = 'include';
      config.surfaceSwitching = 'exclude';
    }
    if (config.preferCurrentTab) {
      config.selfBrowserSurface = 'include';
      config.displaySurface = undefined; // so the default selected is the current tab
    }
    // @ts-ignore
    if (config.cropElement && window.CropTarget?.fromElement) {
      // @ts-ignore
      config.cropTarget = await window.CropTarget.fromElement(config.cropElement);
    }
    return config;
  }

  private createHMSLocalTracks(
    nativeTracks: MediaStreamTrack[],
    settings: HMSTrackSettings,
    localStream?: HMSLocalStream,
  ) {
    const nativeVideoTrack = nativeTracks.find(track => track.kind === 'video');
    const nativeAudioTrack = nativeTracks.find(track => track.kind === 'audio');
    if (localStream) {
      nativeTracks.forEach(track => localStream?.nativeStream.addTrack(track));
    } else {
      localStream = new HMSLocalStream(new MediaStream(nativeTracks));
    }

    const tracks: Array<HMSLocalTrack> = [];
    if (nativeAudioTrack && settings?.audio) {
      const audioTrack = new HMSLocalAudioTrack(
        localStream,
        nativeAudioTrack,
        'regular',
        this.eventBus,
        settings.audio,
      );
      tracks.push(audioTrack);
    }

    if (nativeVideoTrack && settings?.video) {
      const videoTrack = new HMSLocalVideoTrack(
        localStream,
        nativeVideoTrack,
        'regular',
        this.eventBus,
        settings.video,
      );
      videoTrack.setSimulcastDefinitons(
        this.store.getSimulcastDefinitionsForPeer(this.store.getLocalPeer()!, 'regular'),
      );
      tracks.push(videoTrack);
    }
    return tracks;
  }
}
