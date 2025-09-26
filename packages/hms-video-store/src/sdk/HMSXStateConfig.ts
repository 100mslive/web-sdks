/**
 * Configuration for XState track implementation
 * This allows enabling the XState-based track implementation for testing
 */

import { TrackImplementationProvider } from '../media/tracks/TrackImplementationProvider';
import HMSLogger from '../utils/logger';

export class HMSXStateConfig {
  /**
   * Enable or disable XState-based track implementation
   * @param enable - true to use XState implementation, false for original
   */
  static enableXStateTracking(enable: boolean) {
    TrackImplementationProvider.enableXState(enable);
    HMSLogger.i('[HMSXStateConfig]', `XState tracking ${enable ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if XState tracking is enabled
   */
  static isXStateEnabled(): boolean {
    return TrackImplementationProvider.isXStateEnabled();
  }
}
