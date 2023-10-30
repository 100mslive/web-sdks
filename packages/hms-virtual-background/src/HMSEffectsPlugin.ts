import { tsvb } from 'effects-sdk';
import { HMSMediaStreamPlugin } from '@100mslive/hms-video';
import { EFFECTS_SDK_KEY } from './constants';

export class HMSEffectsPlugin implements HMSMediaStreamPlugin {
  private effects: tsvb;
  // Ranges from 0 to 1
  private blurAmount = 0;
  private backgroundURL = '';
  private beautify = false;

  constructor() {
    this.effects = new tsvb(EFFECTS_SDK_KEY);
    this.effects.config({
      models: {
        colorcorrector: '',
        facedetector: '',
      },
    });
    this.effects.onReady = () => {
      if (this.effects) {
        console.debug('effects is ready');
        this.effects.run();
        // available preset mode = 'quality | balanced | speed | lightning'
        this.effects.setSegmentationPreset('balanced');
        // available fit mode = 'fill | fit'
        this.effects.setBackgroundFitMode('fill');
        // Also ranges from 0 to 1
        this.effects.setBeautificationLevel(0.5);
        this.effects.disableBeautification();
      }
    };
  }

  setBlur(blur: number) {
    this.blurAmount = blur;
    this.backgroundURL = '';
  }

  setBackground(url: string) {
    this.backgroundURL = url;
    this.blurAmount = 0;
  }

  apply(stream: MediaStream): MediaStream {
    this.effects.useStream(stream);
    if (this.blurAmount) {
      this.effects.setBlur(this.blurAmount);
    } else if (this.backgroundURL) {
      this.effects.clearBlur();
      this.effects.setBackground(this.backgroundURL);
    }
    if (this.beautify) {
      this.effects.enableBeautification();
    } else {
      this.effects.disableBeautification();
    }
    // getStream potentially returns null
    return this.effects.getStream() || stream;
  }

  stop() {
    this.effects.stop();
  }
}
