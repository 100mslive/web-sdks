/**
 * Temporary diagnostics for cameras that report live and unmuted but deliver no frames.
 * Reports what the camera, page and sender looked like at acquire and over the first seconds, and,
 * when no frames arrive, tries reopening the camera without size constraints and then in portrait,
 * reporting what each attempt delivered. Nothing here may throw into the SDK.
 */
import AnalyticsEvent from '../../analytics/AnalyticsEvent';
import { AnalyticsEventLevel } from '../../analytics/AnalyticsEventLevel';
import HMSLogger from '../../utils/logger';
import { parsedUserAgent } from '../../utils/support';

const TAG = '[CameraFramesProbe]';
const SAMPLE_AT_MS = [1000, 2000, 3000, 5000, 8000, 12000, 20000];
const DETECT_AT_MS = 5000;
const ATTEMPT_WINDOW_MS = 3000;
const MAX_EVENTS_PER_PAGE = 40;
// the acquire extras are optional; a browser call that never settles must not hold up the timeline
const EXTRAS_TIMEOUT_MS = 1500;

export interface CameraProbeHost {
  publish(event: AnalyticsEvent): void;
  getNativeTrack(): MediaStreamTrack;
  getSender(): RTCRtpSender | undefined;
  getSinks(): HTMLVideoElement[];
  getRequestedConstraints(): MediaTrackConstraints;
  getState(): Record<string, unknown>;
  /** true while the SDK itself is turning the camera off or recovering it */
  isBusy(): boolean;
  releaseCamera(): void;
  installCameraTrack(track: MediaStreamTrack): Promise<void>;
  restoreCamera(): Promise<void>;
}

type Sample = Record<string, unknown> & { t_ms: number; frames?: number; frames_from?: string };

// Every camera track the SDK opened on this page, to see whether two were live at once.
const openedCameras: { track: MediaStreamTrack; openedAt: number }[] = [];
let eventsSent = 0;

const safe = <T>(read: () => T): T | undefined => {
  try {
    return read();
  } catch {
    return undefined;
  }
};

const safeAsync = async <T>(read: () => Promise<T>): Promise<T | string | undefined> => {
  try {
    return await read();
  } catch (error) {
    return `error: ${(error as Error)?.name || error}`;
  }
};

// The SDK's parsed user agent once client hints resolve: real Android model and full browser version.
const userAgent = async () => {
  const { browser, os, device, cpu } = await parsedUserAgent.withClientHints();
  return {
    browser: `${browser.name} ${browser.version}`,
    os: `${os.name} ${os.version}`,
    device: { vendor: device.vendor, model: device.model, type: device.type },
    cpu: cpu.architecture,
  };
};

const pageState = () => ({
  visibility: safe(() => document.visibilityState),
  has_focus: safe(() => document.hasFocus()),
  orientation_type: safe(() => window.screen.orientation?.type),
  orientation_angle: safe(() => window.screen.orientation?.angle),
  window_orientation: safe(() => (window as Window & { orientation?: number }).orientation),
  inner_size: safe(() => `${window.innerWidth}x${window.innerHeight}`),
  screen_size: safe(() => `${window.screen.width}x${window.screen.height}`),
  device_pixel_ratio: safe(() => window.devicePixelRatio),
  hardware_concurrency: safe(() => navigator.hardwareConcurrency),
  device_memory: safe(() => (navigator as Navigator & { deviceMemory?: number }).deviceMemory),
  connection_type: safe(
    () => (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
  ),
});

const trackState = (track: MediaStreamTrack) => ({
  id: track.id,
  label: track.label,
  ready_state: track.readyState,
  muted: track.muted,
  enabled: track.enabled,
  content_hint: track.contentHint,
  settings: safe(() => track.getSettings()),
  constraints: safe(() => track.getConstraints()),
  capabilities: safe(() => track.getCapabilities?.()),
  track_stats: trackStats(track),
});

// Chromium's per-track frame counters, the camera's own count independent of the sender.
const trackStats = (track: MediaStreamTrack) =>
  safe(() => {
    const stats = (track as MediaStreamTrack & { stats?: Record<string, number> }).stats;
    return stats
      ? { delivered: stats.deliveredFrames, discarded: stats.discardedFrames, total: stats.totalFrames }
      : undefined;
  });

const sinkState = (sinks: HTMLVideoElement[]) =>
  sinks.map(video => ({
    frames: safe(() => video.getVideoPlaybackQuality?.().totalVideoFrames),
    dropped: safe(() => video.getVideoPlaybackQuality?.().droppedVideoFrames),
    size: `${video.videoWidth}x${video.videoHeight}`,
    ready_state: video.readyState,
    paused: video.paused,
    connected: video.isConnected,
    same_track: safe(() => (video.srcObject as MediaStream | null)?.getVideoTracks()[0]?.id),
  }));

const senderStats = async (sender: RTCRtpSender | undefined, trackId: string) => {
  if (!sender) {
    return undefined;
  }
  const report = await sender.getStats();
  const stats: any[] = [];
  report.forEach(stat => stats.push(stat));
  const sources = stats.filter(stat => stat.type === 'media-source' && stat.kind === 'video');
  // with a plugin the sender reads the processed track, so fall back to whichever source is there
  const source = sources.find(stat => stat.trackIdentifier === trackId) || sources[0];
  const outbound = stats.filter(stat => stat.type === 'outbound-rtp' && stat.kind === 'video').map(outboundState);
  return {
    sender_track_id: sender.track?.id,
    sender_track_state: sender.track?.readyState,
    source: source && {
      track_matches: source.trackIdentifier === trackId,
      frames: source.frames,
      fps: source.framesPerSecond,
      size: `${source.width}x${source.height}`,
    },
    outbound,
  };
};

const outboundState = (stat: any) => ({
  rid: stat.rid,
  active: stat.active,
  frames_encoded: stat.framesEncoded,
  frames_sent: stat.framesSent,
  packets_sent: stat.packetsSent,
  bytes_sent: stat.bytesSent,
  size: `${stat.frameWidth}x${stat.frameHeight}`,
  quality_limitation: stat.qualityLimitationReason,
  encoder: stat.encoderImplementation,
  power_efficient: stat.powerEfficientEncoder,
});

/** The best available count of frames the camera delivered: track counters, then the sender, then the sinks. */
const framesOf = (track: MediaStreamTrack, sender: any, sinks: ReturnType<typeof sinkState>) => {
  const counted = trackStats(track)?.total;
  if (typeof counted === 'number') {
    return { frames: counted, frames_from: 'track' };
  }
  if (sender?.source?.track_matches && typeof sender.source.frames === 'number') {
    return { frames: sender.source.frames as number, frames_from: 'sender' };
  }
  const shown = sinks.filter(sink => sink.same_track === track.id && typeof sink.frames === 'number');
  if (shown.length) {
    return { frames: Math.max(...shown.map(sink => sink.frames as number)), frames_from: 'sink' };
  }
  return { frames: undefined, frames_from: 'none' };
};

const liveCamerasBesides = (track: MediaStreamTrack) => {
  for (let i = openedCameras.length - 1; i >= 0; i--) {
    if (openedCameras[i].track.readyState === 'ended') {
      openedCameras.splice(i, 1);
    }
  }
  return openedCameras
    .filter(opened => opened.track !== track)
    .map(opened => ({ id: opened.track.id, label: opened.track.label, age_ms: Date.now() - opened.openedAt }));
};

const sizeOf = (constraint: ConstrainULong | undefined, fallback: number) =>
  Number(typeof constraint === 'object' ? constraint.ideal ?? constraint.exact : constraint) || fallback;

/** First without size constraints on the same camera, then the same size asked for in portrait. */
const attemptArms = (stuck: MediaStreamTrack, requested: MediaTrackConstraints) => {
  const deviceId = safe(() => stuck.getSettings().deviceId);
  const device = deviceId ? { deviceId: { exact: deviceId } } : {};
  const width = sizeOf(requested.width, 1280);
  const height = sizeOf(requested.height, 720);
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  return [
    { arm: 'drop_constraints', constraints: { ...device } as MediaTrackConstraints },
    { arm: 'portrait', constraints: { ...device, width: { ideal: short }, height: { ideal: long } } },
  ];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = <T>(read: Promise<T>) =>
  Promise.race([read, sleep(EXTRAS_TIMEOUT_MS).then(() => 'timeout' as const)]);

export class CameraFramesProbe {
  private watched?: MediaStreamTrack;
  private timers: { timer: ReturnType<typeof setTimeout>; resolve: () => void }[] = [];
  private attempted = false;
  private acquireCount = 0;

  constructor(private host: CameraProbeHost) {}

  /** Starts reporting on a newly opened camera track, replacing whatever was watched before. */
  watch(track: MediaStreamTrack, reason: string) {
    try {
      if (typeof window === 'undefined' || track.kind !== 'video') {
        return;
      }
      this.stop();
      this.watched = track;
      this.acquireCount++;
      const otherLiveCameras = liveCamerasBesides(track);
      openedCameras.push({ track, openedAt: Date.now() });
      this.run(track, reason, otherLiveCameras).catch(error => HMSLogger.w(TAG, 'probe failed', error));
    } catch (error) {
      HMSLogger.w(TAG, 'watch failed', error);
    }
  }

  stop() {
    this.watched = undefined;
    // pending waits resolve so the run sees the track is no longer watched and sends its summary
    this.timers.forEach(({ timer, resolve }) => {
      clearTimeout(timer);
      resolve();
    });
    this.timers = [];
  }

  private send(phase: string, properties: Record<string, unknown>) {
    if (eventsSent >= MAX_EVENTS_PER_PAGE) {
      return;
    }
    eventsSent++;
    try {
      this.host.publish(
        new AnalyticsEvent({
          name: 'camera.diagnostics',
          level: AnalyticsEventLevel.INFO,
          properties: { phase, acquire_count: this.acquireCount, ...properties },
        }),
      );
    } catch (error) {
      HMSLogger.w(TAG, 'publish failed', error);
    }
  }

  private async snapshot(track: MediaStreamTrack) {
    const sender = await safeAsync(() => senderStats(this.host.getSender(), track.id));
    return {
      page: pageState(),
      track: trackState(track),
      requested_constraints: safe(() => this.host.getRequestedConstraints()),
      sdk: safe(() => ({ ...this.host.getState(), current_track: this.host.getNativeTrack() === track })),
      sinks: safe(() => sinkState(this.host.getSinks())),
      sender,
    };
  }

  private async sample(track: MediaStreamTrack, startedAt: number): Promise<Sample> {
    const sender = await safeAsync(() => senderStats(this.host.getSender(), track.id));
    const sinks = safe(() => sinkState(this.host.getSinks())) || [];
    return {
      t_ms: Date.now() - startedAt,
      ...framesOf(track, sender, sinks),
      ready_state: track.readyState,
      muted: track.muted,
      visibility: safe(() => document.visibilityState),
      orientation_type: safe(() => window.screen.orientation?.type),
      settings_size: safe(() => `${track.getSettings().width}x${track.getSettings().height}`),
      sender,
      sinks,
    };
  }

  private async run(track: MediaStreamTrack, reason: string, otherLiveCameras: unknown[]) {
    const startedAt = Date.now();
    const [ua, devices, permission] = await Promise.all([
      withTimeout(safeAsync(userAgent)),
      withTimeout(
        safeAsync(async () =>
          (await navigator.mediaDevices.enumerateDevices())
            .filter(device => device.kind === 'videoinput')
            .map(device => ({ id: device.deviceId, label: device.label })),
        ),
      ),
      withTimeout(
        safeAsync(async () => (await navigator.permissions.query({ name: 'camera' as PermissionName })).state),
      ),
    ]);
    this.send('acquire', {
      reason,
      other_live_cameras: otherLiveCameras,
      user_agent: ua,
      video_inputs: devices,
      camera_permission: permission,
      ...(await this.snapshot(track)),
    });

    const samples: Sample[] = [];
    for (const at of SAMPLE_AT_MS) {
      await this.wait(startedAt + at - Date.now());
      if (this.watched !== track) {
        break;
      }
      samples.push(await this.sample(track, startedAt));
      if (at === DETECT_AT_MS && this.isStuck(track, samples[samples.length - 1])) {
        this.send('no_frames', { reason, samples, ...(await this.snapshot(track)) });
        await this.attempt(track);
        return;
      }
    }
    this.send('summary', { reason, samples, ended_early: this.watched !== track });
  }

  private isStuck(track: MediaStreamTrack, sample: Sample) {
    return sample.frames === 0 && !this.attempted && this.looksHealthy(track) && this.isIdle(track);
  }

  // what the SDK's own checks see: a live, unmuted, enabled track
  private looksHealthy(track: MediaStreamTrack) {
    return track.readyState === 'live' && !track.muted && track.enabled;
  }

  private isIdle(track: MediaStreamTrack) {
    return document.visibilityState === 'visible' && this.host.getNativeTrack() === track && !this.host.isBusy();
  }

  /** Reopens the stuck camera without size constraints, then in portrait, reporting what each delivered. */
  private async attempt(stuck: MediaStreamTrack) {
    this.attempted = true;
    const { results, recovered } = await this.runArms(
      stuck,
      attemptArms(stuck, safe(() => this.host.getRequestedConstraints()) || {}),
    );
    // never reopen a camera the user turned off or a track that was cleaned up meanwhile
    if (!recovered && this.mayTouchCamera(stuck) && this.host.getNativeTrack().readyState !== 'live') {
      await safeAsync(() => this.host.restoreCamera());
    }
    this.send('attempts', { recovered, results, page: pageState() });
  }

  /** Still watching the stuck camera, video still on, the SDK not recovering it, and the page in front. */
  private mayTouchCamera(stuck: MediaStreamTrack) {
    return this.watched === stuck && !this.host.isBusy() && document.visibilityState === 'visible';
  }

  private async runArms(stuck: MediaStreamTrack, arms: ReturnType<typeof attemptArms>) {
    const results: Record<string, unknown>[] = [];
    for (const { arm, constraints } of arms) {
      if (!this.mayTouchCamera(stuck)) {
        results.push({ arm, skipped: 'video turned off, track replaced or page hidden' });
        break;
      }
      const result = await this.tryArm(stuck, arm, constraints);
      results.push(result);
      if (result.recovered) {
        return { results, recovered: true };
      }
    }
    return { results, recovered: false };
  }

  private async tryArm(stuck: MediaStreamTrack, arm: string, constraints: MediaTrackConstraints) {
    const startedAt = Date.now();
    const released = this.host.getNativeTrack();
    this.host.releaseCamera();
    let track: MediaStreamTrack;
    try {
      track = (await navigator.mediaDevices.getUserMedia({ video: constraints })).getVideoTracks()[0];
    } catch (error) {
      return { arm, constraints, error: `${(error as Error)?.name}: ${(error as Error)?.message}` };
    }
    const gumMs = Date.now() - startedAt;
    // the user may have turned video off, or the SDK swapped or cleaned up the track, while this opened
    if (!this.mayTouchCamera(stuck) || this.host.getNativeTrack() !== released) {
      track.stop();
      return { arm, constraints, get_user_media_ms: gumMs, aborted: 'camera state changed during the attempt' };
    }
    const installed = await safeAsync(() => this.host.installCameraTrack(track));
    openedCameras.push({ track, openedAt: Date.now() });
    await sleep(ATTEMPT_WINDOW_MS);
    const sample = await this.sample(track, startedAt);
    return {
      arm,
      constraints,
      get_user_media_ms: gumMs,
      install_error: typeof installed === 'string' ? installed : undefined,
      recovered: typeof sample.frames === 'number' && sample.frames > 0,
      track: trackState(track),
      sample,
    };
  }

  private wait(ms: number) {
    return new Promise<void>(resolve => {
      this.timers.push({ timer: setTimeout(resolve, Math.max(0, ms)), resolve });
    });
  }
}
