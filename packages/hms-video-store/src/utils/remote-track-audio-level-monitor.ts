import HMSLogger from './logger';
import { HMSAudioContextHandler } from './media';
import { Queue } from './queue';
import { sleep } from './timer-utils';
import { HMSRemoteAudioTrack } from '../media/tracks';

export class RemoteTrackAudioLevelMonitor {
  private readonly TAG = '[RemoteTrackAudioLevelMonitor]';
  private analyserNode?: AnalyserNode;
  private dataArray?: Uint8Array;
  private isMonitored = false;
  private interval = 100;
  private historyInterval = 700;
  private history = new Queue<number>(this.historyInterval / this.interval);

  constructor(private track: HMSRemoteAudioTrack, private onSilenceDetected?: (track: HMSRemoteAudioTrack) => void) {
    try {
      const stream = new MediaStream([this.track.nativeTrack]);
      this.analyserNode = this.createAnalyserNodeForStream(stream);
      const bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (ex) {
      HMSLogger.w(this.TAG, 'Unable to initialize AudioContext', ex);
    }
  }

  detectSilence = async () => {
    const tickInterval = 20;
    const tickThreshold = 50;
    let silenceCounter = 0;

    while (this.isMonitored) {
      if (this.track.enabled) {
        if (this.isSilentThisInstant()) {
          silenceCounter++;
          if (silenceCounter > tickThreshold) {
            this.onSilenceDetected?.(this.track);
            break;
          }
        } else {
          break;
        }
      }
      await sleep(tickInterval);
    }
  };

  start() {
    this.stop();
    this.isMonitored = true;
    HMSLogger.d(this.TAG, 'Starting remote track monitor', `${this.track}`);
    this.loop().then(() => HMSLogger.d(this.TAG, 'Stopping remote track monitor', `${this.track}`));
  }

  stop() {
    if (!this.analyserNode) {
      HMSLogger.d(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.isMonitored = false;
  }

  cleanup() {
    this.stop();
    this.analyserNode?.disconnect();
    this.analyserNode = undefined;
    this.dataArray = undefined;
  }

  private async loop() {
    while (this.isMonitored) {
      this.getMaxAudioLevelOverPeriod();
      await sleep(this.interval);
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
      return false;
    }

    this.analyserNode.getByteTimeDomainData(this.dataArray);
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
