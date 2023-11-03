import { HMSVBPlugin } from '@100mslive/hms-virtual-background';
import { VB_EFFECT } from '../../components/VirtualBackground/constants';

class VBPluginSingleton {
  constructor() {
    if (VBPluginSingleton.instance) {
      return VBPluginSingleton.instance;
    }
    this.vbPluginRef = new HMSVBPlugin(VB_EFFECT.NONE, VB_EFFECT.NONE);
    console.debug('initialized VB plugin', this.vbPluginRef);
    VBPluginSingleton.instance = this;
  }
}

const vbPluginSingleton = new VBPluginSingleton();

export const vbPluginRef = vbPluginSingleton.vbPluginRef;
