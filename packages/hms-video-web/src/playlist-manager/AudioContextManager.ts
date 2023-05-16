import HMSLogger from '../utils/logger';

export class AudioContextManager {
  private audioContext: AudioContext;
  private readonly TAG = '[AudioContextManager]';

  constructor() {
    this.audioContext = new AudioContext();
  }

  /**
   * Resume AudioContext if it is suspended
   * Note: when the browser tab is muted by default, AudioContext will be in suspended state
   * It has to be resumed for the video/audio to be played.
   */
  async resumeContext() {
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        HMSLogger.d(this.TAG, 'AudioContext is resumed');
      } catch (error) {
        HMSLogger.d(this.TAG, 'AudioContext failed to resume', error);
      }
    }
  }

  getContext() {
    return this.audioContext;
  }

  getAudioTrackFromElement(element: HTMLMediaElement) {
    const source = this.audioContext.createMediaElementSource(element);
    const destination = this.audioContext.createMediaStreamDestination();
    source.connect(this.audioContext.destination);
    source.connect(destination);
    return destination.stream.getAudioTracks()[0];
  }

  cleanup() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => {
        HMSLogger.d(this.TAG, 'AudioContext close error', e.message);
      });
    }
  }
}
