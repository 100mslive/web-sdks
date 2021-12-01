/**
 * A plugin implementing this interface can be registered with HMSLocalAudioTrack to transform, process or
 * analyze the local audio track.These can include applications like background noise removal, speech commands, live
 * analysis of audio etc. The below functions are required for the sdk to properly use the plugin, usually
 * the plugin would also be exposing some public functions of its own for the UI to control its working.
 */

export interface HMSAudioPlugin {
  /**
   * This function will be called by the SDK for audio track which the plugin needs to process.
   * The reason audio context is also part of the interface is that it's recommeneded to reuse on audio context
   * instead of creating new for every use - https://developer.mozilla.org/en-US/docs/Web/API/AudioContext 
   */
  processAudioTrack(ctx: AudioContext, source: AudioNode): Promise<AudioNode>;

  /**
   * This function will be called before the call to init, it is used to check whether the plugin supports current
   * OS and device or not. An error will be thrown back to the user if they try to use an unsupported plugin.
   */
  isSupported(): boolean;

  /**
   * This function will be called in the beginning for initialization which may include tasks like setting up
   * variables, loading ML models etc. This can be used by a plugin to ensure it's prepared at the time
   * processAudio is called.
   */
  init(): Promise<void> | void;

  /**
   * The name is meant to uniquely specify a plugin instance. This will be used to track number of plugins
   * added to the track, and same name won't be allowed twice.
   */
  getName(): string;

  /**
   This sets the Plugin type @see HMSAudioPluginType, processing will happen
   based on the type of plugin
   */
  getPluginType(): HMSAudioPluginType;
  /*
   * the plugin can use this function to dispose off its resources. It'll be called when the plugin instance is
   * no longer needed at the end.
   */
  stop(): void;
}

/**
 * Specifies the type of the plugin a transforming plugin will get an output audio node to give the resulting
 * transformation. While an analyzing plugin will only be passed the input node.
 */
export enum HMSAudioPluginType {
  TRANSFORM = 'TRANSFORM',
  ANALYZE = 'ANALYZE',
}
