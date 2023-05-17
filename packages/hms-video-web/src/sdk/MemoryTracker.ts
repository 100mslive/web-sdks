import AnalyticsEvent from '../analytics/AnalyticsEvent';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { MEMORY_CHECK_INTERVAL } from '../utils/constants';

export class MemoryTracker {
  private timerId?: ReturnType<typeof setInterval>;
  constructor(private sendAnalyticsEvent: (event: AnalyticsEvent) => void) {
    this.start();
  }

  private start = () => {
    this.timerId = setInterval(this.checkAndReportMemoryUsage, MEMORY_CHECK_INTERVAL);
  };

  checkAndReportMemoryUsage = () => {
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
  };

  cleanup = () => {
    clearInterval(this.timerId);
    this.timerId = undefined;
  };

  private convertBytesToMB = (value: number) => {
    return Math.round(value / Math.pow(1024, 2));
  };
}
