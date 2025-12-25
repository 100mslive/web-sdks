import { HMSPluginSupportResult } from '../../plugins';

/**
 * Base interface for plugin managers that handle plugin lifecycle
 */
export interface HMSPluginManager<TPlugin> {
  /**
   * Get list of active plugin names
   */
  getPlugins(): string[];

  /**
   * Add a plugin to the manager
   */
  addPlugin(plugin: TPlugin, ...args: any[]): Promise<void>;

  /**
   * Remove a plugin from the manager
   */
  removePlugin(plugin: TPlugin): Promise<void>;

  /**
   * Validate if a plugin is supported
   */
  validatePlugin(plugin: TPlugin): HMSPluginSupportResult;

  /**
   * Clean up all plugins and resources
   */
  cleanup(): Promise<void>;
}

/**
 * Base class for local tracks that support plugins
 */
export abstract class HMSLocalTrackWithPlugins {
  /**
   * Get list of active plugins
   */
  abstract getPlugins(): string[];

  /**
   * Add a plugin to this track
   */
  abstract addPlugin(plugin: any, ...args: any[]): Promise<void>;

  /**
   * Remove a plugin from this track
   */
  abstract removePlugin(plugin: any): Promise<void>;

  /**
   * Validate if a plugin is supported
   */
  abstract validatePlugin(plugin: any): HMSPluginSupportResult;

  /**
   * Set the processed track after plugin processing
   * @internal
   */
  abstract setProcessedTrack(processedTrack?: MediaStreamTrack): Promise<void>;

  /**
   * Get the track being sent (potentially processed by plugins)
   * @internal
   */
  abstract getTrackBeingSent(): MediaStreamTrack;

  /**
   * Get the ID of the track being sent
   * @internal
   */
  abstract getTrackIDBeingSent(): string;
}
