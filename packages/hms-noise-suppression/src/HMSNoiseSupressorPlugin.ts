/* eslint-disable complexity */
import {
  HMSAudioPlugin,
  HMSAudioPluginType,
  HMSPluginSupportResult,
  HMSPluginUnsupportedTypes,
} from '@100mslive/hms-video';
// @ts-ignore
import NoiseModule from './models/Noise.js';

const TAG = 'NoiseSuppressionProcessor';
const pkg = require('../package.json');

const RNNNOISE_SAMPLE_LENGTH = 480;
const MIN_SAMPLE_RATE = 44100;
const MAX_SAMPLE_RATE = 48000;
const DEFAULT_DURATION_MS = 80;

/*The buffer size in units of sample-frames, it will be in power of 2.
If specified, the bufferSize must be one of the following values: 256, 512, 1024, 2048, 4096, 8192, 16384
This value controls how frequently the audioprocess event is dispatched and how many sample-frames need to be processed each call.
Lower values for bufferSize will result in a lower(better) latency. Higher values will be necessary to avoid audio breakup and glitches.*/

//TODO: add implement HMSAudioPlugin after sdk changes
export class HMSNoiseSuppressionPlugin implements HMSAudioPlugin {
  suppressNoise: boolean;
  nodesConnected: boolean;
  nodesCreated: boolean;
  addNoise?: boolean; // Parameter to enable random noise addition to audio

  noiseNode?: any; // audio node which will add extra noise if addNoise is enabled
  processingNode: any; // audio node which will process the input audio
  module: any; // noise module to remove extra noise and this is where RNN model is stored
  bufferSize: number;
  samplingRate: number;
  channels: number;
  durationInMs: number;
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  startTime: any;

  constructor(durationInMs?: number) {
    this.suppressNoise = true;
    this.nodesConnected = false;
    this.nodesCreated = false;
    this.module = null;
    this.bufferSize = 0;
    this.samplingRate = 0;
    this.audioContext = null;
    this.sourceNode = null;
    this.channels = 1;
    if (durationInMs) {
      this.durationInMs = durationInMs;
    } else {
      this.durationInMs = DEFAULT_DURATION_MS;
    }
  }

  init(): Promise<void> | void {
    if (!this.module) {
      this.module = {
        noExitRuntime: true,
        noInitialRun: true,
        preInit: [],
        preRun: [],
        postRun: [
          function () {
            console.log(`Loaded Javascript Module OK`);
          },
        ],
        memoryInitializerPrefixURL: 'bin/',
        arguments: ['input.ivf', 'output.raw'],
      };

      NoiseModule(this.module);
      this.module.st = this.module._rnnoise_create();
      this.module.ptr = this.module._malloc(RNNNOISE_SAMPLE_LENGTH * 4);
      //set default random noise to false
      this.addRandomNoise(false);
    }

    this.suppressNoise = true;
  }

  /*
  @depreceated
   */
  isSupported(): boolean {
    return (
      navigator.userAgent.indexOf('Chrome') !== -1 ||
      navigator.userAgent.indexOf('Edg') !== -1 ||
      navigator.userAgent.indexOf('Edge') !== -1 ||
      navigator.userAgent.indexOf('Firefox') !== -1
    );
  }

  checkSupport(ctx?: AudioContext): HMSPluginSupportResult {
    const deviceResult = {} as HMSPluginSupportResult;
    const sampleRate = ctx?.sampleRate || MAX_SAMPLE_RATE; //using this as default
    if (sampleRate < MIN_SAMPLE_RATE || sampleRate > MAX_SAMPLE_RATE) {
      deviceResult.isSupported = false;
      deviceResult.errType = HMSPluginUnsupportedTypes.DEVICE_NOT_SUPPORTED;
      deviceResult.errMsg = 'audio device not supported for plugin, see docs';
    } else {
      deviceResult.isSupported = true;
    }
    //Removing Support for firefox because of AudioContext with different sample rate is not supported
    const browserResult = {} as HMSPluginSupportResult;
    if (['Chrome', 'Firefox', 'Edg', 'Edge'].some(value => navigator.userAgent.indexOf(value) !== -1)) {
      browserResult.isSupported = true;
    } else {
      browserResult.isSupported = false;
      browserResult.errType = HMSPluginUnsupportedTypes.PLATFORM_NOT_SUPPORTED;
      browserResult.errMsg = 'browser not supported for plugin, see docs';
    }

    if (!deviceResult.isSupported) {
      return deviceResult;
    } else if (!browserResult.isSupported) {
      return browserResult;
    } else {
      return deviceResult;
    }
  }

  getName(): string {
    return pkg.name;
  }

  getPluginType(): HMSAudioPluginType {
    return HMSAudioPluginType.TRANSFORM;
  }

  getBufferSize(): number {
    const val = (this.samplingRate * this.channels * this.durationInMs) / 1000;
    let bufferSize = 1;
    while (bufferSize < val) {
      bufferSize *= 2;
    }

    return bufferSize;
  }

  stop(): void {
    this.setEnabled(false);
    this.nodesConnected = false;
    this.nodesCreated = false;
    if (this.processingNode) {
      this.processingNode.disconnect();
    }
  }

  setEnabled(value: boolean) {
    this.suppressNoise = value;
  }
  removeNoise(buffer: any, module: any) {
    const ptr = module.ptr;
    const st = module.st;
    for (let i = 0; i < RNNNOISE_SAMPLE_LENGTH; i++) {
      module.HEAPF32[(ptr >> 2) + i] = buffer[i] * 32768;
    }
    module._rnnoise_process_frame(st, ptr, ptr);
    for (let i = 0; i < RNNNOISE_SAMPLE_LENGTH; i++) {
      buffer[i] = module.HEAPF32[(ptr >> 2) + i] / 32768;
    }
  }

  processAudioTrack(audioContext: AudioContext, sourceNode: MediaStreamAudioSourceNode): Promise<AudioNode> {
    if (!audioContext) {
      throw new Error('Audio context is not created');
    }
    this.audioContext = audioContext;
    if (!sourceNode) {
      throw new Error('source node is not defined');
    }
    this.sourceNode = sourceNode;

    if (this.module) {
      //model is initialized
      this.samplingRate = this.audioContext.sampleRate;
      this.channels = 1; //TODO:check this
      this.bufferSize = this.getBufferSize();
      HMSNoiseSuppressionPlugin.log(
        TAG,
        'sampling rate, channels, bufferSize, durationMs',
        this.samplingRate,
        this.channels,
        this.bufferSize,
        this.durationInMs,
      );

      if (!this.nodesCreated) {
        this.createNodes(audioContext);
        this.nodesCreated = true;
      }
      if (!this.nodesConnected) {
        this.connectAudioNodes(audioContext, sourceNode);
        this.nodesConnected = true;
      }
      // optional to add random noise to audio
      if (this.addNoise) {
        this.processNoiseNode();
      }
      HMSNoiseSuppressionPlugin.log(TAG, this.suppressNoise);
      this.onAudioProcess();
    } else {
      //initialize if not being done by sdk
      this.init();
    }
    return this.processingNode;
  }

  private static log(tag: string, ...data: any[]) {
    console.info(tag, ...data);
  }

  private onAudioProcess() {
    const frameBuffer: any = [];
    const inputBuffer: any = [];
    const outputBuffer: any = [];

    this.processingNode.onaudioprocess = (e: any) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);

      // Drain input buffer.
      for (let i = 0; i < this.bufferSize; i++) {
        inputBuffer.push(input[i]);
      }
      while (inputBuffer.length >= RNNNOISE_SAMPLE_LENGTH) {
        for (let i = 0; i < RNNNOISE_SAMPLE_LENGTH; i++) {
          frameBuffer[i] = inputBuffer.shift();
        }
        if (this.suppressNoise) {
          this.removeNoise(frameBuffer, this.module);
        }
        for (let i = 0; i < RNNNOISE_SAMPLE_LENGTH; i++) {
          outputBuffer.push(frameBuffer[i]);
        }
      }
      // Not enough data, exit early, otherwise the AnalyserNode returns NaNs.
      if (outputBuffer.length < this.bufferSize) {
        return;
      }
      // Flush output buffer.
      for (let i = 0; i < this.bufferSize; i++) {
        output[i] = outputBuffer.shift();
      }
    };
  }

  private connectAudioNodes(audioContext: AudioContext, sourceNode: MediaStreamAudioSourceNode) {
    // nodes are connected to each other like in graph, output of one is passed to next in line
    if (this.addNoise && audioContext) {
      sourceNode.connect(this.noiseNode);
      this.noiseNode.connect(this.processingNode);
    } else {
      sourceNode.connect(this.processingNode);
    }
  }

  private createNodes(audioContext: AudioContext) {
    if (audioContext) {
      this.processingNode = audioContext.createScriptProcessor(
        this.bufferSize,
        1, // no of input channels
        1, // no of output channels
      );
      if (this.addNoise) {
        this.noiseNode = audioContext.createScriptProcessor(
          this.bufferSize,
          1, // no of input channels
          1, // no of output channels
        );
      }
    } else {
      HMSNoiseSuppressionPlugin.log(TAG, 'audio context is null');
    }
  }

  // addRandomNoise api
  private addRandomNoise(value: boolean) {
    this.addNoise = value;
  }

  private processNoiseNode() {
    const addNoise = this.addNoise;
    this.noiseNode.onaudioprocess = function (e: any) {
      this.input = e.inputBuffer.getChannelData(0);
      this.output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < this.input.length; i++) {
        if (addNoise) {
          this.output[i] = this.input[i] + Math.random() / 100;
        } else {
          this.output[i] = this.input[i];
        }
      }
    };
  }
}
