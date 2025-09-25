/**
 * Configuration for XState track implementation
 * This allows enabling the XState-based track implementation for testing
 */

import { TrackImplementationFactory } from '../media/tracks/TrackImplementationFactory';
import HMSLogger from '../utils/logger';

export class HMSXStateConfig {
  private static enabled = false;

  /**
   * Enable or disable XState-based track implementation
   * @param enable - true to use XState implementation, false for original
   */
  static enableXStateTracking(enable: boolean) {
    HMSXStateConfig.enabled = enable;
    TrackImplementationFactory.enableXState(enable);
    HMSLogger.i('[HMSXStateConfig]', `XState tracking ${enable ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if XState tracking is enabled
   */
  static isXStateEnabled(): boolean {
    return HMSXStateConfig.enabled;
  }

  /**
   * Enable XState tracking via URL parameter for testing
   * Add ?xstate=true to the URL to enable
   */
  static checkURLParameter() {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const xstateParam = params.get('xstate');
      if (xstateParam === 'true') {
        HMSXStateConfig.enableXStateTracking(true);
        console.log('🚀 XState tracking enabled via URL parameter');
      }
    }
  }
}

// Auto-check URL parameter on module load
if (typeof window !== 'undefined') {
  HMSXStateConfig.checkURLParameter();
}