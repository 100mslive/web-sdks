import HMSLogger from './logger';
import { HMSAudioContextHandler } from './media';
import { Queue } from './queue';
import { sleep } from './timer-utils';
import { isEmptyTrack } from './track';
import { HMSInternalEvent } from '../events/HMSInternalEvent';
import { HMSLocalAudioTrack } from '../internal';

/** Send update only if audio level is above THRESHOLD */
const THRESHOLD = 35;

/** Send update only if audio level is changed by UPDATE_THRESHOLD */
const UPDATE_THRESHOLD = 5;

export interface ITrackAudioLevelUpdate {
  track: HMSLocalAudioTrack;
  audioLevel: number;
}

// Audio level algorithm referenced from official MDN example - https://github.com/mdn/dom-examples/tree/main/media/web-dictaphone
export class TrackAudioLevelMonitor {
  private readonly TAG = '[TrackAudioLevelMonitor]';
  private audioLevel = 0;
  private analyserNode?: AnalyserNode;
  private dataArray?: Uint8Array;
  private isMonitored = false;
  /** Frequency of polling audio level from track */
  private interval = 100;
  /** Store past audio levels for this duration */
  private historyInterval = 700;
  private history = new Queue<number>(this.historyInterval / this.interval);
  private speakingWhileMutedCounter = 0;
  private lastSpeakingWhileMutedTime = 0;
  /** Combined grace period and cooldown - prevents detection immediately after muting and between events (in milliseconds) */
  private speakingWhileMutedThrottlePeriod = 5000;
  /** Tracks if user is currently speaking while muted */
  private isSpeakingWhileMuted = false;
  /** Counter for consecutive silent ticks while previously speaking */
  private silentWhileMutedCounter = 0;
  /** Number of silent ticks (5 seconds) required before stopping detection */
  private readonly SILENT_TICKS_THRESHOLD = 50; // 50 ticks * 100ms = 5 seconds
  /** Track previous enabled state to detect transitions */
  private wasTrackEnabled = true;
  /** Monitoring track that stays enabled to detect audio even when main track is muted */
  private monitoringTrack?: MediaStreamTrack;

  constructor(
    private track: HMSLocalAudioTrack,
    private audioLevelEvent: HMSInternalEvent<ITrackAudioLevelUpdate>,
    private silenceEvent: HMSInternalEvent<{ track: HMSLocalAudioTrack }>,
    private speakingWhileMutedEvent?: HMSInternalEvent<{ track: HMSLocalAudioTrack; audioLevel: number }>,
  ) {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    try {
      // Stop and clean up previous monitoring track if it exists
      if (this.monitoringTrack) {
        this.monitoringTrack.stop();
        this.monitoringTrack = undefined;
      }

      // Only create monitoring track if the main track is not empty
      // Empty tracks (created from AudioContext) produce no audio
      if (!isEmptyTrack(this.track.nativeTrack)) {
        // Clone the track for monitoring - this stays enabled even when main track is muted
        this.monitoringTrack = this.track.nativeTrack.clone();
        this.monitoringTrack.enabled = true;
        const stream = new MediaStream([this.monitoringTrack]);
        this.analyserNode = this.createAnalyserNodeForStream(stream);
        const bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        HMSLogger.d(this.TAG, 'Monitor initialized with cloned track for always-on monitoring');
      } else {
        // For empty tracks, use the original track (won't produce audio anyway)
        const stream = new MediaStream([this.track.nativeTrack]);
        this.analyserNode = this.createAnalyserNodeForStream(stream);
        const bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        HMSLogger.d(this.TAG, 'Monitor initialized with empty track - will reinitialize when real track available');
      }
    } catch (ex) {
      HMSLogger.w(this.TAG, 'Unable to initialize monitoring', ex);
    }
  }

  /**
   * To detect silence we check if the track is unmuted and silent in the current moment
   * periodically. If the track is found to be silent more than a threshold number of times
   * we send the event. The threshold number of time is there to reduce the chance of false
   * positives.
   */
  detectSilence = async () => {
    const tickInterval = 20;
    const tickThreshold = 50;
    let silenceCounter = 0;

    while (this.isMonitored) {
      if (this.track.enabled) {
        if (this.isSilentThisInstant()) {
          silenceCounter++;
          if (silenceCounter > tickThreshold) {
            this.silenceEvent.publish({ track: this.track });
            break;
          }
        } else {
          // bail out immediately if sound is found
          break;
        }
      }
      await sleep(tickInterval);
    }
  };

  start() {
    this.stop();
    // Reinitialize monitoring in case the track has changed (e.g., from empty to real track)
    this.initializeMonitoring();
    this.isMonitored = true;
    HMSLogger.d(this.TAG, 'Starting track Monitor', `${this.track}`);
    this.loop().then(() => HMSLogger.d(this.TAG, 'Stopping track Monitor', `${this.track}`));
  }

  stop() {
    if (!this.analyserNode) {
      HMSLogger.d(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.sendAudioLevel(0);
    this.isMonitored = false;

    // Clean up monitoring track
    if (this.monitoringTrack) {
      this.monitoringTrack.stop();
      this.monitoringTrack = undefined;
      HMSLogger.d(this.TAG, 'Stopped and cleaned up monitoring track');
    }
  }

  private async loop() {
    let loopCount = 0;
    while (this.isMonitored) {
      const audioLevel = this.getMaxAudioLevelOverPeriod();
      this.sendAudioLevel(audioLevel);
      this.detectSpeakingWhileMuted(audioLevel);

      // Debug: Log every 10 iterations to show monitor is running
      if (loopCount % 10 === 0 && !this.track.enabled) {
        HMSLogger.d(this.TAG, 'Monitor loop running while muted, audio level:', audioLevel);
      }
      loopCount++;

      await sleep(this.interval);
    }
  }

  /**
   * Detects if the user is speaking while their microphone is muted (disabled).
   * Only triggers the event if the track is disabled and audio level is consistently above threshold.
   */
  private detectSpeakingWhileMuted(audioLevel?: number) {
    if (!this.shouldDetectSpeakingWhileMuted(audioLevel)) {
      return;
    }

    // Track state transitions
    const trackEnabledStateChanged = this.track.enabled !== this.wasTrackEnabled;

    // Only detect when track is disabled (muted)
    if (!this.track.enabled) {
      // Update timestamp only when transitioning from enabled to disabled (when user mutes)
      if (trackEnabledStateChanged && this.wasTrackEnabled) {
        this.lastSpeakingWhileMutedTime = Date.now();
      }
      this.handleMutedSpeaking(audioLevel!);
    } else {
      // Reset counters when track is enabled
      this.speakingWhileMutedCounter = 0;
      this.silentWhileMutedCounter = 0;
      // If was speaking while muted, emit stopped event
      if (this.isSpeakingWhileMuted) {
        this.isSpeakingWhileMuted = false;
        this.speakingWhileMutedEvent?.publish({ track: this.track, audioLevel: 0 });
      }
    }

    // Update previous state
    this.wasTrackEnabled = this.track.enabled;
  }

  private shouldDetectSpeakingWhileMuted(audioLevel?: number): boolean {
    return Boolean(this.speakingWhileMutedEvent && audioLevel);
  }

  private handleMutedSpeaking(audioLevel: number) {
    if (audioLevel > THRESHOLD) {
      // User is speaking - reset silent counter
      this.silentWhileMutedCounter = 0;
      this.speakingWhileMutedCounter++;
      this.maybeEmitSpeakingWhileMutedEvent(audioLevel);
    } else {
      // Audio level dropped
      this.speakingWhileMutedCounter = 0;

      // If was speaking while muted, count silent ticks before stopping
      if (this.isSpeakingWhileMuted) {
        this.silentWhileMutedCounter++;

        // Only emit stopped event after 5 seconds of silence
        if (this.silentWhileMutedCounter >= this.SILENT_TICKS_THRESHOLD) {
          this.isSpeakingWhileMuted = false;
          this.silentWhileMutedCounter = 0;
          this.speakingWhileMutedEvent?.publish({ track: this.track, audioLevel: 0 });
        }
      }
    }
  }

  private maybeEmitSpeakingWhileMutedEvent(audioLevel: number) {
    // Require 3 consecutive ticks (300ms) above threshold before emitting
    if (this.speakingWhileMutedCounter < 3) {
      return;
    }

    const now = Date.now();
    const timeSinceLastEvent = now - this.lastSpeakingWhileMutedTime;

    // Only emit if throttle period has passed (grace period after muting or cooldown between events)
    if (timeSinceLastEvent >= this.speakingWhileMutedThrottlePeriod) {
      if (!this.isSpeakingWhileMuted) {
        this.isSpeakingWhileMuted = true;
        this.speakingWhileMutedEvent?.publish({ track: this.track, audioLevel });
        this.lastSpeakingWhileMutedTime = now;
        HMSLogger.w(this.TAG, 'Speaking while muted detected', `${this.track}`, 'audio level:', audioLevel);
      }
    }
    // Reset counter after triggering
    this.speakingWhileMutedCounter = 0;
  }

  private sendAudioLevel(audioLevel = 0) {
    audioLevel = audioLevel > THRESHOLD ? audioLevel : 0;
    const isSignificantChange = Math.abs(this.audioLevel - audioLevel) > UPDATE_THRESHOLD;
    if (isSignificantChange) {
      this.audioLevel = audioLevel;
      const audioLevelUpdate: ITrackAudioLevelUpdate = { track: this.track, audioLevel: this.audioLevel };
      this.audioLevelEvent.publish(audioLevelUpdate);
    }
  }

  private getMaxAudioLevelOverPeriod() {
    if (!this.analyserNode) {
      HMSLogger.d(this.TAG, 'AudioContext not initialized');
      return;
    }
    const newLevel = this.calculateAudioLevel();
    newLevel !== undefined && this.history.enqueue(newLevel);
    return this.history.aggregate(values => Math.max(...values));
  }

  private calculateAudioLevel() {
    if (!this.analyserNode || !this.dataArray) {
      HMSLogger.d(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.analyserNode.getByteTimeDomainData(this.dataArray);
    const lowest = 0.009;
    let max = lowest;
    for (const frequency of this.dataArray) {
      max = Math.max(max, (frequency - 128) / 128);
    }
    const normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
    const percent = Math.ceil(Math.min(Math.max(normalized * 100, 0), 100));
    return percent;
  }

  isSilentThisInstant() {
    if (!this.analyserNode || !this.dataArray) {
      HMSLogger.d(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.analyserNode.getByteTimeDomainData(this.dataArray);

    // For absolute silence(in case of mic/software failures), all frequencies are 128 or 0.
    return this.dataArray.every(frequency => frequency === 128 || frequency === 0);
  }

  private createAnalyserNodeForStream(stream: MediaStream): AnalyserNode {
    const audioContext = HMSAudioContextHandler.getAudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    return analyser;
  }
}
