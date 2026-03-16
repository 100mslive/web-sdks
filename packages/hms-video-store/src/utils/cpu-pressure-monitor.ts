import HMSLogger from './logger';

export type CPUPressureState = 'nominal' | 'fair' | 'serious' | 'critical';

interface PressureRecord {
  state: CPUPressureState;
  time: number;
}

/**
 * Monitors CPU pressure using the Compute Pressure API (PressureObserver)
 * and tracks the worst state observed during the session.
 */
export class CPUPressureMonitor {
  private observer: any;
  private worstState: CPUPressureState | undefined = undefined;
  private TAG = '[CPUPressureMonitor]';

  private readonly stateRanking: Record<CPUPressureState, number> = {
    nominal: 0,
    fair: 1,
    serious: 2,
    critical: 3,
  };

  constructor() {
    this.init();
  }

  private async init() {
    if (!('PressureObserver' in window)) {
      HMSLogger.d(this.TAG, 'PressureObserver API not available');
      return;
    }

    try {
      // @ts-ignore - PressureObserver is not yet in TypeScript definitions
      this.observer = new PressureObserver((records: PressureRecord[]) => {
        if (records.length > 0) {
          const newState = records[records.length - 1].state;
          this.updateWorstState(newState);
        }
      });

      await this.observer.observe('cpu', {
        sampleInterval: 10000, // 10 seconds
      });

      this.worstState = 'nominal';
      HMSLogger.d(this.TAG, 'CPU pressure monitoring started');
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to initialize CPU pressure monitoring', error);
    }
  }

  private updateWorstState(newState: CPUPressureState) {
    if (this.worstState === undefined) {
      this.worstState = newState;
      return;
    }
    if (this.stateRanking[newState] > this.stateRanking[this.worstState]) {
      this.worstState = newState;
      HMSLogger.d(this.TAG, `New worst CPU state: ${this.worstState}`);
    }
  }

  /**
   * Get the worst CPU pressure state observed since last reset
   * Returns undefined if the API is not supported
   */
  getWorstState(): CPUPressureState | undefined {
    return this.worstState;
  }

  /**
   * Reset the worst state back to nominal for the next monitoring window
   * Call this after sending analytics to track worst state per window
   */
  resetWorstState() {
    if (this.worstState !== undefined) {
      this.worstState = 'nominal';
      HMSLogger.d(this.TAG, 'CPU worst state reset to nominal');
    }
  }

  /**
   * Stop monitoring and clean up
   */
  stop() {
    if (this.observer) {
      try {
        this.observer.disconnect();
        HMSLogger.d(this.TAG, 'CPU pressure monitoring stopped');
      } catch (error) {
        HMSLogger.e(this.TAG, 'Error stopping CPU pressure monitoring', error);
      }
    }
  }
}
