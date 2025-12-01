import HMSLogger from './logger';

export type CPUPressureState = 'nominal' | 'fair' | 'serious' | 'critical';

interface PressureRecord {
  state: CPUPressureState;
  time: number;
}

/**
 * Monitors CPU pressure using the Compute Pressure API (PressureObserver)
 * and provides the current pressure state.
 */
export class CPUPressureMonitor {
  private observer: any;
  private currentState: CPUPressureState = 'nominal';
  private listeners: Set<(state: CPUPressureState) => void> = new Set();
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
        const latestRecord = records[records.length - 1];
        if (latestRecord && latestRecord.state !== this.currentState) {
          this.currentState = latestRecord.state;
          HMSLogger.d(this.TAG, `CPU pressure state changed to: ${this.currentState}`);
          this.notifyListeners(this.currentState);
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
   * Subscribe to CPU pressure state changes
   */
  subscribe(listener: (state: CPUPressureState) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(state: CPUPressureState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        HMSLogger.e(this.TAG, 'Error in CPU pressure listener', error);
      }
    });
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
    this.listeners.clear();
  }
}
