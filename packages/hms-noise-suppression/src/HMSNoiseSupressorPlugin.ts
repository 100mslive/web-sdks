// @ts-ignore
import { NoiseModule } from './models/Noise';
import { HMSAudioPlugin, HMSAudioPluginType } from '@100mslive/hms-video';

const TAG = 'NoiseSuppressionProcessor';
const pkg = require('../package.json');

//The buffer size in units of sample-frames, it will be in power of 2.
//If specified, the bufferSize must be one of the following values: 256, 512, 1024, 2048, 4096, 8192, 16384
//This value controls how frequently the audioprocess event is dispatched and how many sample-frames need to be processed each call.
//Lower values for bufferSize will result in a lower(better) latency. Higher values will be necessary to avoid audio breakup and glitches.
const bufferSize = 2048;

//TODO: add implement HMSAudioPlugin after sdk changes
export class HMSNoiseSuppressionPlugin implements HMSAudioPlugin {
  suppressNoise: boolean;
  nodesConnected: boolean;
  nodesCreated: boolean;
  addNoise?: boolean; // Parameter to enable random noise addition to audio

  noiseNode?: any; // audio node which will add extra noise if addNoise is enabled
  processingNode: any; // audio node which will process the input audio
  module: any; // noise module to remove extra noise and this is where RNN model is stored

  constructor() {
    this.suppressNoise = true;
    this.nodesConnected = false;
    this.nodesCreated = false;
    this.module = null;
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
      this.module.ptr = this.module._malloc(480 * 4);
      //set default random noise to false
      this.addRandomNoise(false);
    }
  }

  isSupported(): boolean {
    return ['Chrome', 'Firefox', 'Edg'].some(navigator.userAgent.includes);
  }

  getName(): string {
    return pkg.name;
  }

  getPluginType(): HMSAudioPluginType {
    return HMSAudioPluginType.TRANSFORM;
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
    for (let i = 0; i < 480; i++) {
      module.HEAPF32[(ptr >> 2) + i] = buffer[i] * 32768;
    }
    module._rnnoise_process_frame(st, ptr, ptr);
    for (let i = 0; i < 480; i++) {
      buffer[i] = module.HEAPF32[(ptr >> 2) + i] / 32768;
    }
  }

  processAudioTrack(audioContext: AudioContext, sourceNode: MediaStreamAudioSourceNode): Promise<AudioNode> {
    if (!audioContext) {
      throw new Error('Audio context is not created');
    }
    if (!sourceNode) {
      throw new Error('source node is not defined');
    }
    if (this.module) {
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
      const frameBuffer: any = [];
      const inputBuffer: any = [];
      const outputBuffer: any = [];

      this.log(TAG, this.suppressNoise);
      this.processingNode.onaudioprocess = (e: any) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);

        // Drain input buffer.
        for (let i = 0; i < bufferSize; i++) {
          inputBuffer.push(input[i]);
        }
        while (inputBuffer.length >= 480) {
          for (let i = 0; i < 480; i++) {
            frameBuffer[i] = inputBuffer.shift();
          }
          if (this.suppressNoise) {
            this.removeNoise(frameBuffer, this.module);
          }
          for (let i = 0; i < 480; i++) {
            outputBuffer.push(frameBuffer[i]);
          }
        }
        // Not enough data, exit early, otherwise the AnalyserNode returns NaNs.
        if (outputBuffer.length < bufferSize) {
          return;
        }
        // Flush output buffer.
        for (let i = 0; i < bufferSize; i++) {
          output[i] = outputBuffer.shift();
        }
      };
    }
    return this.processingNode;
  }

  private log(tag: string, ...data: any[]) {
    console.info(tag, ...data);
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
        bufferSize,
        1, // no of input channels
        1, // no of output channels
      );
      if (this.addNoise) {
        this.noiseNode = audioContext.createScriptProcessor(
          bufferSize,
          1, // no of input channels
          1, // no of output channels
        );
      }
    } else {
      this.log(TAG, 'audio context is null');
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
