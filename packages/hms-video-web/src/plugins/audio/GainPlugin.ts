import { HMSAudioPluginType, HMSAudioPlugin } from './HMSAudioPlugin';

export class GainPlugin implements HMSAudioPlugin {
  private gainNode?: GainNode;
  async processAudioTrack(ctx: AudioContext, source: AudioNode) {
    if (!ctx) {
      throw new Error('Audio context is not created');
    }
    if (!source) {
      throw new Error('source is not defined');
    }
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.25;
    source.connect(this.gainNode);
    return this.gainNode;
  }

  isSupported() {
    return true;
  }

  init() {}

  getName() {
    return 'gain-node';
  }

  getPluginType() {
    return HMSAudioPluginType.TRANSFORM;
  }

  stop() {
    this.gainNode?.disconnect();
    this.gainNode = undefined;
  }
}
