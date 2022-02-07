import { HMSInternalEvent } from '../events/HMSInternalEvent';
import { HMSAudioTrack } from '../media/tracks';
import HMSLogger from './logger';
import { sleep } from './timer-utils';

const THRESHOLD = 35;
const UPDATE_THRESHOLD = 5;

export interface ITrackAudioLevelUpdate {
  track: HMSAudioTrack;
  audioLevel: number;
}

export class TrackAudioLevelMonitor {
  private readonly TAG = '[TrackAudioLevelMonitor]';
  private audioLevel = 0;
  private analyserNode?: AnalyserNode;
  private isMonitored = false;
  private interval = 1000;
  private silenceTimeout?: ReturnType<typeof setTimeout>;

  constructor(private track: HMSAudioTrack, private audioLevelEvent: HMSInternalEvent<ITrackAudioLevelUpdate>) {
    try {
      const stream = new MediaStream([this.track.nativeTrack]);
      this.analyserNode = this.createAnalyserNodeForStream(stream);
    } catch (ex) {
      HMSLogger.w(this.TAG, 'Unable to initialize AudioContext', ex);
    }
  }

  /**
   * Detects silence by resolving to true if the audio track remains silent for threshold ms.
   * Resolves to false on valid audio input
   */
  detectSilence = async (threshold = 5000) => {
    let thresholdPassed = false;
    this.silenceTimeout = setTimeout(() => {
      thresholdPassed = true;
    }, threshold);

    /**
     * Stop when cleaned up(timeout cleared) or threshold has passed
     */
    while (this.silenceTimeout && !thresholdPassed) {
      const level = this.calculateAudioLevel();
      if (level !== 0) {
        return false;
      }
      await sleep(300);
    }

    return true;
  };

  start() {
    this.stop();
    this.isMonitored = true;
    HMSLogger.d(this.TAG, 'Starting track Monitor', this.track);
    this.loop().then(() => HMSLogger.d(this.TAG, 'Stopping track Monitor', this.track));
  }

  stop() {
    if (!this.analyserNode) {
      HMSLogger.w(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.updateAudioLevel(0);
    this.isMonitored = false;
  }

  private async loop() {
    while (this.isMonitored) {
      this.updateAudioLevel(this.calculateAudioLevel());
      await sleep(this.interval);
    }
  }

  private updateAudioLevel(audioLevel = 0) {
    /**
     * Running Average on the difference between 100ms SFU audio leveland calculated percent
     * showed a difference of 15, hence adding 15 to compensate
     */
    if (audioLevel !== 0) {
      audioLevel = Math.min(audioLevel + 15, 100); // if exceeds 100
    }
    audioLevel = audioLevel > THRESHOLD ? audioLevel : 0;
    const isSignificantChange =
      audioLevel < this.audioLevel - UPDATE_THRESHOLD || audioLevel > this.audioLevel + UPDATE_THRESHOLD;
    if (isSignificantChange) {
      this.audioLevel = audioLevel;
      const audioLevelUpdate: ITrackAudioLevelUpdate = { track: this.track, audioLevel: this.audioLevel };
      this.audioLevelEvent.publish(audioLevelUpdate);
    }
  }

  /**
   * Ref: https://github.com/aws/amazon-chime-sdk-js/blob/main/demos/browser/app/meetingV2/meetingV2.ts#L2738-L2745
   */
  private calculateAudioLevel() {
    if (!this.analyserNode) {
      HMSLogger.w(this.TAG, 'AudioContext not initialized');
      return;
    }

    const data = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(data);
    const lowest = 0.009;
    let max = lowest;
    for (const frequency of data) {
      max = Math.max(max, (frequency - 128) / 128);
    }
    const normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
    const percent = Math.ceil(Math.min(Math.max(normalized * 100, 0), 100));
    return percent;
  }

  private createAnalyserNodeForStream(stream: MediaStream): AnalyserNode {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    return analyser;
  }
}
