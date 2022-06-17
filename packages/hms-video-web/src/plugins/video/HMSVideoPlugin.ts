import { HMSPluginSupportResult } from '../audio';

/**
 * A plugin implementing this interface can be registered with HMSLocalVideoTrack to transform, process or
 * analyze the local video track.These can include applications like video filters, virtual background, live
 * analysis of video etc. The below functions are required for the sdk to properly use the plugin, usually
 * the plugin would also be exposing some public functions of its own for the UI to control its working.
 */
export interface HMSVideoPlugin {
  /**
   * The name is meant to uniquely specify a plugin instance. This will be used to track number of plugins
   * added to the track, and same name won't be allowed twice.
   */
  getName(): string;

  /**
   * This function will be called before the call to init, it is used to check whether the plugin supports current
   * OS and device or not. An error will be thrown back to the user if they try to use an unsupported plugin.
   */
  checkSupport(): HMSPluginSupportResult;

  /**
   * @deprecated. Will be deleted in future updates. Use checkSupport instead.
   */
  isSupported(): boolean;

  /**
   * This function will be called in the beginning for initialization which may include tasks like setting up
   * variables, loading ML models etc. This can be used by a plugin to ensure it's prepared at the time
   * processVideoFrame is called.
   */
  init(): Promise<void>;

  /**
   * @see HMSVideoPluginType
   */
  getPluginType(): HMSVideoPluginType;

  getContextType?(): HMSVideoPluginCanvasContextType;

  /**
   * This function will be called by the SDK for every video frame which the plugin needs to process.
   * PluginFrameRate - the rate at which the plugin is expected to process the video frames. This is not necessarily
   * equal to the capture frame rate. The user can specify this rate, and the sdk might also change it on basis of
   * device type, or CPU usage.
   * For an analyzing plugin, the below function will be called at plugin framerate.
   * For a transforming plugin, the sdk will pass in the input and output at real frame rate with an additional boolean
   * pass. The expectation is that the plugin should use results of previous runs instead of doing a complex processing
   * again when pass is set to true. This helps in maintaining the framerate of the video as well as bringing down
   * CPU usage in case of complex processing.
   * @param input input canvas containing the input frame
   * @param output the output canvas which should contain the output frame
   * @param skipProcessing use results from previous run if true
   */
  processVideoFrame(
    input: HTMLCanvasElement,
    output?: HTMLCanvasElement,
    skipProcessing?: boolean,
  ): Promise<void> | void;

  /**
   * the plugin can use this function to dispose off its resources. It'll be called when the processor instance is
   * no longer needed at the end.
   */
  stop(): void;
}

/**
 * Specifies the type of the plugin a transforming plugin will get an output canvas to give the resulting
 * transformation. While an analyzing plugin will only be passed the input canvas.
 */
export enum HMSVideoPluginType {
  TRANSFORM = 'TRANSFORM',
  ANALYZE = 'ANALYZE',
}

export enum HMSVideoPluginCanvasContextType {
  '2D' = '2d',
  WEBGL = 'webgl',
  'WEBGL2' = 'webgl2',
}
