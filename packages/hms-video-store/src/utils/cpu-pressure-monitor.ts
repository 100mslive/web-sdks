import HMSLogger from './logger';

export type CPUPressureState = 'nominal' | 'fair' | 'serious' | 'critical';

interface PressureRecord {
  state: CPUPressureState;
  time: number;
}

/**
 * Monitors CPU pressure using the Compute Pressure API (PressureObserver)
 * and provides the current pressure state on demand.
 */
export class CPUPressureMonitor {
  private observer: any;
  private currentState: CPUPressureState = 'nominal';
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
      this.observer = new PressureObserver((records: PressureRecord[]) => {
        if (records.length > 0) {
          this.currentState = records[records.length - 1].state;
        }
      });

      await this.observer.observe('cpu', {
        sampleInterval: 1000, // 1 second
      });

      HMSLogger.d(this.TAG, 'CPU pressure monitoring started');
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed to initialize CPU pressure monitoring', error);
    }
  }

  /**
   * Get the current CPU pressure state
   */
  getCurrentState(): CPUPressureState {
    return this.currentState;
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
