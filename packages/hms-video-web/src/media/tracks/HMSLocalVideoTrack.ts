import { HMSVideoTrack } from './HMSVideoTrack';
import HMSLocalStream from '../streams/HMSLocalStream';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from '../settings/HMSVideoTrackSettings';
import { getEmptyVideoTrack, getVideoTrack } from '../../utils/track';
import { HMSVideoProcessor } from '../../interfaces/videoProcessors';

function generateHasPropertyChanged(newSettings: HMSVideoTrackSettings, oldSettings: HMSVideoTrackSettings) {
  return function hasChanged(
    prop: 'codec' | 'width' | 'height' | 'maxFramerate' | 'maxBitrate' | 'deviceId' | 'advanced',
  ) {
    return prop in newSettings && newSettings[prop] !== oldSettings[prop];
  };
}

export class HMSLocalVideoTrack extends HMSVideoTrack {
  settings: HMSVideoTrackSettings;
  private timerID: number;
  processedTrack: MediaStreamTrack | null = null;
  private processorsMap: Record<string, HMSVideoProcessor>; //name and Processor
  constructor(
    stream: HMSLocalStream,
    track: MediaStreamTrack,
    source: string,
    settings: HMSVideoTrackSettings = new HMSVideoTrackSettingsBuilder().build(),
  ) {
    super(stream, track, source);
    stream.tracks.push(this);
    this.settings = settings;
    this.processorsMap = {};
    this.timerID = 0;
  }

  private async replaceTrackWith(settings: HMSVideoTrackSettings) {
    const prevTrack = this.nativeTrack;
    prevTrack?.stop();
    const withTrack = await getVideoTrack(settings);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
  }

  private async replaceTrackWithBlank() {
    const prevTrack = this.nativeTrack;
    const withTrack = getEmptyVideoTrack(prevTrack);
    await (this.stream as HMSLocalStream).replaceTrack(this, withTrack);
    prevTrack?.stop();
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    if (this.source === 'regular') {
      if (value) {
        await this.replaceTrackWith(this.settings);
        //Find all Processors attach and add them
        // if (Object.keys(this.processorsMap).length !== 0) {
        //   for (const procName of this.processors) {
        //     if (procName !== '') {
        //       await this.addProcessor(this.processorsMap[procName]);
        //     }
        //   }
        // }
      } else {
        await this.replaceTrackWithBlank();
        // if (Object.keys(this.processorsMap).length !== 0) {
        //   for (const procName of this.processors) {
        //     if (procName !== '') {
        //       await this.removeProcessor(this.processorsMap[procName]);
        //     }
        //   }
        // }
      }
    }
    await super.setEnabled(value);
    (this.stream as HMSLocalStream).trackUpdate(this);
  }

  // addSink(videoElement: HTMLVideoElement) {
  //   if(this.processedTrack){
  //     videoElement.srcObject = new MediaStream([this.processedTrack]);
  //   }
  //   else{
  //     super.addSink(videoElement);
  //   }
  // }

  async addProcessor(processor: HMSVideoProcessor): Promise<void> {
    console.log('inside addProcessor function call');
    if (!this.nativeTrack.enabled) {
      console.log('Track is not enabled');
      return;
    }
    if (processor == null) {
      console.log('Processor is possibly null');
      return;
    }
    if (!processor.isSupported()) {
      console.log('Platform is not supported');
      return;
    }

    const input = this.getInputCanvas();
    const output = document.createElement('canvas') as any;
    //for firefox
    output.getContext('2d');

    let name = processor.getName();
    console.log('Platform is supported...starting processor ', name);
    await processor.init();
    processor.processVideo(input, output);

    this.processorsMap[name] = processor;

    if (this.processors) {
      this.processors = Object.assign([], this.processors);
      if (!this.processors.includes(name)) {
        this.processors?.push(name);
      } else {
        throw new Error('Processor is already added to track');
      }
    }

    console.log('Number of Processors added = ', this.processors.length);

    const fps = processor.getFrameRate();
    let modifiedStream = output.captureStream(fps); //TODO :check fps is required
    let track = modifiedStream.getVideoTracks()[0];
    console.log('Modified track', track.id, 'native track', this.nativeTrack.id);
    this.processedTrack = this.nativeTrack;
    await (this.stream as HMSLocalStream).replaceTrackWithoutStop(this, track);
  }

  async removeProcessor(processor: HMSVideoProcessor): Promise<void> {
    if (!processor || !processor.isSupported()) {
      console.log("Can't Remove Unsupported/Invalid Processor");
    } else {
      console.log('Removing processor', processor);
      processor.stop();
      const name = processor.getName();
      this.processors = Object.assign([], this.processors);
      const idx = this.processors.indexOf(name);
      if (idx > -1) {
        this.processors.splice(idx, 1);
      }
      if (this.processorsMap[name]) {
        delete this.processorsMap[name];
      }
      await (this.stream as HMSLocalStream).replaceTrackWithoutStop(this, this.processedTrack!);
    }
  }

  async clearProcessors() {
    for (const name of Object.keys(this.processorsMap)) {
      await this.removeProcessor(this.processorsMap[name]);
    }

    this.processorsMap = {};
    this.processors = [];
  }

  async setSettings(settings: HMSVideoTrackSettings) {
    const { width, height, codec, maxFramerate, maxBitrate, deviceId, advanced } = { ...this.settings, ...settings };
    const newSettings = new HMSVideoTrackSettings(width, height, codec, maxFramerate, deviceId, advanced, maxBitrate);
    const stream = this.stream as HMSLocalStream;
    const hasPropertyChanged = generateHasPropertyChanged(settings, this.settings);

    if (hasPropertyChanged('deviceId') && this.source === 'regular') {
      await this.replaceTrackWith(newSettings);
    }

    if (hasPropertyChanged('maxBitrate') && newSettings.maxBitrate) {
      await stream.setMaxBitrate(newSettings.maxBitrate, this);
    }

    if (hasPropertyChanged('width') || hasPropertyChanged('height') || hasPropertyChanged('advanced')) {
      await this.nativeTrack.applyConstraints(newSettings.toConstraints());
    }

    this.settings = newSettings;
  }

  getInputCanvas(): HTMLCanvasElement {
    if (this.timerID !== 0) clearTimeout(this.timerID);

    const width = this.nativeTrack.getSettings().width;
    const height = this.nativeTrack.getSettings().height;

    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error('Invalid video track');
    }
    //setting input
    const input = document.createElement('canvas');
    const ctx = input.getContext('2d');
    const video = document.createElement('video');
    video.srcObject = new MediaStream([this.nativeTrack]);
    // if (this.processedTrack) {
    //   video.srcObject = new MediaStream([this.processedTrack]);
    // } else {
    //   video.srcObject = new MediaStream([this.nativeTrack]);
    // }
    video.muted = true;
    video.width = width;
    video.height = height;
    video.play();

    input.width = width;
    input.height = height;

    const drawInput = () => {
      ctx!.drawImage(video, 0, 0, width, height);
      this.timerID = window.setTimeout(drawInput, 30); //TODO: check interval time
    };
    drawInput();

    return input;
  }
}
