import { HMSPluginSupportResult } from '../audio';

export interface HMSMediaStreamPlugin {
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
   * This function will be called in the beginning for initialization which may include tasks like setting up
   * variables, config etc. This can be used by a plugin to ensure it's prepared at the time
   * apply is called.
   */
  init(): Promise<void>;

  apply(stream: MediaStream): MediaStream;

  stop(): void;
}
