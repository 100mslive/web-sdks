import HMSLogger from '../utils/logger';

export class AudioContextManager {
  private audioContext: AudioContext;
  private destinationNode?: MediaStreamAudioDestinationNode;
  private source: MediaElementAudioSourceNode;
  private readonly TAG = '[AudioContextManager]';

  constructor(element: HTMLMediaElement) {
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaElementSource(element);
    this.source.connect(this.audioContext.destination);
  }

  /**
   * Resume AudioContext if it is suspended
   * Note: when the browser tab is muted by default, AudioContext will be in suspended state
   * It has to be resumed for the video/audio to be played.
   */
  async resumeContext() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      HMSLogger.d(this.TAG, 'AudioContext is resumed');
    }
  }

  getAudioTrack() {
    // Always create a destinationNode to get new audio track id
    if (this.destinationNode) {
      this.source.disconnect(this.destinationNode);
    }
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.source.connect(this.destinationNode);
    return this.destinationNode.stream.getAudioTracks()[0];
  }

  cleanup() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => {
        HMSLogger.d(this.TAG, 'AudioContext close error', e.message);
      });
    }
  }
}
