import HMSLogger from './logger';

export type CPUPressureState = 'nominal' | 'fair' | 'serious' | 'critical';

interface PressureRecord {
  state: CPUPressureState;
  time: number;
}

/**
 * Monitors CPU pressure using the Compute Pressure API (PressureObserver)
 * and provides the current pressure state on demand using takeRecords().
 */
export class CPUPressureMonitor {
  private observer: any;
  private TAG = '[CPUPressureMonitor]';

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
      this.observer = new PressureObserver(() => {});

      await this.observer.observe('cpu', {
        sampleInterval: 1000, // 1 second
      });

      HMSLogger.d(this.TAG, 'CPU pressure monitoring started');
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to initialize CPU pressure monitoring', error);
    }
  }

  /**
   * Get the current CPU pressure state by taking records from the observer
   */
  getCurrentState(): CPUPressureState {
    if (!this.observer) {
      return 'nominal';
    }

    try {
      const records: PressureRecord[] = this.observer.takeRecords();
      if (records.length > 0) {
        return records[records.length - 1].state;
      }
    } catch (error) {
      HMSLogger.e(this.TAG, 'Error taking CPU pressure records', error);
    }

    return 'nominal';
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
