/**
 * Refer: https://github.com/cwilso/volume-meter/blob/master/volume-meter.js
 */

import { HMSInternalEvent } from '../events/HMSInternalEvent';
import { HMSAudioTrack } from '../media/tracks';
import HMSLogger from './logger';

const THRESHOLD = 35;
const UPDATE_THRESHOLD = 5;

export interface ITrackAudioLevelUpdate {
  track: HMSAudioTrack;
  audioLevel: number;
}

export class TrackAudioLevelMonitor {
  private readonly TAG = '[TrackAudioLevelMonitor]';
  private interval?: number;
  private audioContext?: AudioContext;
  private audioSource?: MediaStreamAudioSourceNode;
  // @TODO: ScriptProcessorNode Deprecated - Replace with audio analyer node
  private processor?: ScriptProcessorNode;
  private averaging = 0.99;
  private audioLevel = 0;
  private rawLevel = 0;

  private updateAudioLevel(value: number) {
    const audioLevel = Math.ceil(Math.min(value * 400, 100));
    if (audioLevel < this.audioLevel - UPDATE_THRESHOLD || audioLevel > this.audioLevel + UPDATE_THRESHOLD) {
      this.audioLevel = audioLevel > THRESHOLD ? audioLevel : 0;
      const audioLevelUpdate = this.audioLevel ? { track: this.track, audioLevel: this.audioLevel } : undefined;
      this.audioLevelEvent.publish(audioLevelUpdate);
    }
  }

  constructor(private track: HMSAudioTrack, private audioLevelEvent: HMSInternalEvent<ITrackAudioLevelUpdate>) {
    try {
      this.audioContext = new AudioContext();
      this.audioSource = this.audioContext.createMediaStreamSource(new MediaStream([this.track.nativeTrack]));
      this.processor = this.audioContext.createScriptProcessor(512);
      this.processor.addEventListener('audioprocess', this.processVolume);
      this.audioSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (ex) {
      HMSLogger.w(this.TAG, 'Unable to initialize AudioContext', ex);
    }
  }

  private processVolume = (event: AudioProcessingEvent) => {
    const input = event.inputBuffer.getChannelData(0);
    // Calculating root mean square
    let sum = 0.0;
    for (let i = 0; i < input.length; ++i) {
      sum += input[i] * input[i];
    }
    const rms = Math.sqrt(sum / input.length);
    this.rawLevel = Math.max(rms, this.rawLevel * this.averaging);
  };

  start() {
    if (!this.isInitialized()) {
      HMSLogger.w(this.TAG, 'AudioContext not initialized');
      return;
    }

    let prev = -1;
    this.interval = window.setTimeout(() => {
      if (this.rawLevel !== prev) {
        // only send an update when there is a change
        prev = this.rawLevel;
        this.updateAudioLevel(this.rawLevel);
      }
      this.start();
    }, 1000);
  }

  stop() {
    if (!this.isInitialized()) {
      HMSLogger.w(this.TAG, 'AudioContext not initialized');
      return;
    }

    this.updateAudioLevel(0);
    window.clearInterval(this.interval);
    this.interval = undefined;
  }

  isInitialized() {
    return Boolean(this.audioContext && this.audioSource && this.processor);
  }
}
