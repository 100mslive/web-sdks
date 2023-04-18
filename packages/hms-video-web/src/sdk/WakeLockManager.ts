import HMSLogger from '../utils/logger';

export class WakeLockManager {
  private readonly TAG = '[WakeLockManager]';
  private wakeLock: WakeLockSentinel | null = null;

  acquireLock = async () => {
    await this.requestWakeLock();
    document?.addEventListener('visibilitychange', this.visibilityHandler);
  };

  cleanup = () => {
    if (this.wakeLock && !this.wakeLock.released) {
      this.wakeLock.release();
    }
    this.wakeLock = null;
  };

  private visibilityHandler = async () => {
    if (document?.visibilityState === 'visible' && (!this.wakeLock || this.wakeLock.released)) {
      await this.requestWakeLock();
    }
  };

  // Function that attempts to request a screen wake lock.
  private requestWakeLock = async () => {
    try {
      if (!('wakeLock' in navigator)) {
        HMSLogger.d(this.TAG, 'Wake lock feature not supported');
        return;
      }
      this.wakeLock = await navigator.wakeLock.request('screen');
      HMSLogger.d(this.TAG, 'Wake lock acquired');
    } catch (err) {
      const error = err as Error;
      HMSLogger.e(this.TAG, 'Error acquiring wake lock', `${error.name}, ${error.message}`);
    }
  };
}
