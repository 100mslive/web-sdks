/* eslint-disable complexity */
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose, POSE_CONNECTIONS, Results as MediaPipeResults } from '@mediapipe/pose';
import { HMSPluginSupportResult, HMSVideoPlugin, HMSVideoPluginType } from '@100mslive/hms-video';

const TAG = '[PoseProcessor]';

export class HMSPosePlugin implements HMSVideoPlugin {
  segmentation!: Pose;
  outputCanvas?: HTMLCanvasElement;
  outputCtx?: CanvasRenderingContext2D | null;

  constructor() {
    this.log('Virtual Background plugin created');
  }

  isSupported(): boolean {
    return this.checkSupport().isSupported;
  }

  checkSupport(): HMSPluginSupportResult {
    return { isSupported: true };
  }

  getName(): string {
    return 'HMSPosePlugin';
  }

  getPluginType(): HMSVideoPluginType {
    return HMSVideoPluginType.TRANSFORM;
  }

  async init(): Promise<void> {
    if (!this.segmentation) {
      this.segmentation = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });
      this.segmentation.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: false,
      });
      this.segmentation.onResults(this.handleResults);
    }
  }

  stop(): void {
    this.segmentation?.reset();
  }

  async processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement, skipProcessing?: boolean) {
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }
    if (skipProcessing) {
      return;
    }
    output.width = input.width;
    output.height = input.height;
    this.outputCanvas = output;
    this.outputCtx = output.getContext('2d');
    await this.segmentation.send({ image: input });
  }

  private handleResults = (results: MediaPipeResults) => {
    if (!this.outputCanvas || !this.outputCtx) {
      return;
    }
    this.outputCtx.save();
    this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    this.renderBackground(results);
    this.outputCtx.restore();
  };

  private log(...data: any[]) {
    console.debug(TAG, ...data);
  }

  private renderBackground = (results: MediaPipeResults) => {
    if (!this.outputCanvas || !this.outputCtx) {
      return;
    }
    this.outputCtx.save();
    console.error(results.image, results.poseLandmarks);
    this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    this.outputCtx.globalCompositeOperation = 'destination-atop';
    this.outputCtx.drawImage(results.image, 0, 0, this.outputCanvas.width, this.outputCanvas.height);

    this.outputCtx.globalCompositeOperation = 'source-over';
    drawConnectors(this.outputCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#FFF', lineWidth: 4 });
    drawLandmarks(this.outputCtx, results.poseLandmarks, {
      color: '#FFF',
      lineWidth: 2,
      radius: 4,
      fillColor: 'rgb(255,138,0)',
    });
    this.outputCtx.restore();
  };
}
