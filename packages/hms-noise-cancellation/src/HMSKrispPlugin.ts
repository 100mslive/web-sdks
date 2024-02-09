// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import type { AudioFilterNode } from 'https://assets.100ms.live/krisp/krispsdk.d.ts';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import KrispSDK from 'https://assets.100ms.live/krisp/krispsdk.mjs';
import { HMSAudioPlugin, HMSAudioPluginType, HMSPluginSupportResult } from '@100mslive/hms-video-store';

export class HMSKrispPlugin implements HMSAudioPlugin {
  private sdk: KrispSDK | null = null;
  private readonly TAG = '[HMSKrispPlugin}';
  private filterNode: AudioFilterNode | null = null;

  checkSupport(): HMSPluginSupportResult {
    return {
      isSupported: KrispSDK.isSupported(),
    };
  }
  async init() {
    this.sdk = new KrispSDK({
      params: {
        debugLogs: false,
        logProcessStats: false,
        useSharedArrayBuffer: false,
        // useBVC: true,
        models: {
          // modelBVC: 'https://assets.100ms.live/krisp/models/model_bvc.kw',
          model8: 'https://assets.100ms.live/krisp/models/model_8.kw',
          model16: 'https://assets.100ms.live/krisp/models/model_16.kw',
          model32: 'https://assets.100ms.live/krisp/models/model_32.kw',
        },
      },
    });

    await this.sdk.init();
  }
  getPluginType() {
    return HMSAudioPluginType.TRANSFORM;
  }

  getName() {
    return 'HMSKrispPlugin';
  }
  isSupported() {
    return KrispSDK.isSupported();
  }

  toggle() {
    this.filterNode?.toggle();
  }

  isEnabled() {
    return this.filterNode?.isEnabled();
  }

  async processAudioTrack(ctx: AudioContext, source: AudioNode) {
    this.filterNode = await this.sdk.createNoiseFilter(
      ctx,
      () => {
        this.filterNode.enable();
        console.log(this.TAG, 'filter node created and enabled');
        source.connect(this.filterNode);
      },
      () => {},
    );
    return this.filterNode;
  }
  stop() {
    this.sdk = null;
  }
}
