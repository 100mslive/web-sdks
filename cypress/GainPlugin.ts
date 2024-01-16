import { HMSAudioPlugin, HMSAudioPluginType } from '@100mslive/hms-video-store';

export class GainPlugin implements HMSAudioPlugin {
  private gainNode?: GainNode;
  private gainValue = 0.25;
  private name = 'gain-plugin';

  constructor(gainValue?: number, name?: string) {
    if (gainValue !== undefined) {
      this.gainValue = gainValue;
    }
    if (name) {
      this.name = name;
    }
  }

  checkSupport() {
    return { isSupported: true };
  }

  async processAudioTrack(ctx: AudioContext, source: AudioNode) {
    if (!ctx) {
      throw new Error('Audio context is not created');
    }
    if (!source) {
      throw new Error('source is not defined');
    }
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.gainValue;
    source.connect(this.gainNode);
    return this.gainNode;
  }

  isSupported() {
    return true;
  }

  init() {}

  getName() {
    return this.name;
  }

  getPluginType() {
    return HMSAudioPluginType.TRANSFORM;
  }

  stop() {
    this.gainNode?.disconnect();
    this.gainNode = undefined;
  }
}
