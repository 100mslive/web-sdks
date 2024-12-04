import HMSLogger from '../utils/logger';

export class WakeLockManager {
  private readonly TAG = '[WakeLockManager]';
  private wakeLock: WakeLockSentinel | null = null;

  acquireLock = async () => {
    await this.requestWakeLock();
    document?.addEventListener('visibilitychange', this.visibilityHandler);
  };

  cleanup = async () => {
    if (this.wakeLock && !this.wakeLock.released) {
      try {
        await this.wakeLock.release();
        HMSLogger.d(this.TAG, 'Wake lock released');
      } catch (err) {
        const error = err as Error;
        HMSLogger.w(this.TAG, 'Error while releasing wake lock', `name=${error.name}, message=${error.message}`);
      }
    }
    document?.removeEventListener('visibilitychange', this.visibilityHandler);
    this.wakeLock = null;
  };

  private visibilityHandler = async () => {
    if (document?.visibilityState === 'visible' && (!this.wakeLock || this.wakeLock.released)) {
      HMSLogger.d(this.TAG, 'Re-acquiring wake lock due to visibility change');
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
      HMSLogger.w(this.TAG, 'Error acquiring wake lock', `name=${error.name}, message=${error.message}`);
    }
  };
}
