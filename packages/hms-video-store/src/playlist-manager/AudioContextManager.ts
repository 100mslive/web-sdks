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
   * Resume AudioContext if it is not running
   * Note: when the browser tab is muted by default, AudioContext will be in suspended state
   * It has to be resumed for the video/audio to be played.
   * Safari also reports a non standard 'interrupted' state after an OS audio interruption - an
   * incoming call or another app taking the audio session - which a check for 'suspended' misses.
   */
  async resumeContext() {
    const state = this.audioContext.state;
    // resume rejects on a closed context, cleanup closes this one
    if (state === 'running' || state === 'closed') {
      return;
    }
    await this.audioContext.resume();
    HMSLogger.d(this.TAG, 'AudioContext is resumed', `from ${state}`);
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
