export class HMSVideoProcessorState {
  static LOADING = 'LOADING';
  static STARTED = 'STARTED';
  static FAILED = 'FAILED';
}

export interface HMSVideoProcessor {
  init(): Promise<void>;
  getState(): string; //TODO: return proper types
  processVideo(input: HTMLCanvasElement, output: HTMLCanvasElement): Promise<void> | void;
  getName(): string;
  isSupported(): boolean;
  getFrameRate(): number;
  stop(): void;
}
