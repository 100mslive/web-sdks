import HMSLogger from './logger';
import { HMSAudioContextHandler } from './media';
import { Queue } from './queue';
import { sleep } from './timer-utils';
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

  constructor(
    private track: HMSLocalAudioTrack,
    private audioLevelEvent: HMSInternalEvent<ITrackAudioLevelUpdate>,
    private silenceEvent: HMSInternalEvent<{ track: HMSLocalAudioTrack }>,
  ) {
    try {
      const stream = new MediaStream([this.track.nativeTrack]);
      this.analyserNode = this.createAnalyserNodeForStream(stream);
      const bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (ex) {
      HMSLogger.w(this.TAG, 'Unable to initialize AudioContext', ex);
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
  }

  private async loop() {
    while (this.isMonitored) {
      this.sendAudioLevel(this.getMaxAudioLevelOverPeriod());
      await sleep(this.interval);
    }
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
