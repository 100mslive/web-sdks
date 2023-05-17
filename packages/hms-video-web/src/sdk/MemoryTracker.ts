import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { MEMORY_CHECK_INTERVAL } from '../utils/constants';

export class MemoryTracker {
  private timerId?: ReturnType<typeof setInterval>;
  constructor(private sendAnalyticsEvent: (event: AnalyticsEvent) => void) {
    this.start();
  }

  private start = () => {
    this.timerId = setInterval(() => {
      if (!window?.performance?.memory) {
        return;
      }
      const { totalJSHeapSize, usedJSHeapSize } = window.performance.memory;
      const percentage = usedJSHeapSize / totalJSHeapSize;
      if (percentage >= 90) {
        this.sendAnalyticsEvent(
          AnalyticsEventFactory.memoryUsed({
            percentage,
            total: this.convertBytesToMB(totalJSHeapSize),
            used: this.convertBytesToMB(usedJSHeapSize),
          }),
        );
      }
    }, MEMORY_CHECK_INTERVAL);
  };

  cleanup = () => {
    clearInterval(this.timerId);
    this.timerId = undefined;
  };

  private convertBytesToMB = (value: number) => {
    return Math.round(value / Math.pow(1024, 2));
  };
}
