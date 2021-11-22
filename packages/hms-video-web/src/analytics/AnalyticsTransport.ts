import HMSLogger from '../utils/logger';
import { Queue } from '../utils/queue';
import AnalyticsEvent from './AnalyticsEvent';
import { IAnalyticsTransportProvider } from './IAnalyticsTransportProvider';

export abstract class AnalyticsTransport {
  abstract transportProvider: IAnalyticsTransportProvider;
  abstract failedEvents: Queue<AnalyticsEvent>;
  private TAG = 'AnalyticsTransport';

  sendEvent(event: AnalyticsEvent) {
    try {
      this.sendSingleEvent(event);
      this.flushFailedEvents();
    } catch (error) {
      HMSLogger.w(this.TAG, 'sendEvent failed', error);
    }
  }

  flushFailedEvents() {
    try {
      HMSLogger.d(this.TAG, 'Flushing failed events', this.failedEvents);
      while (this.failedEvents.size() > 0) {
        const event = this.failedEvents.dequeue();
        if (event) {
          this.sendSingleEvent(event);
        }
      }
    } catch (error) {
      HMSLogger.w(this.TAG, 'flushFailedEvents failed', error);
    }
  }

  private sendSingleEvent(event: AnalyticsEvent) {
    try {
      HMSLogger.d(this.TAG, 'Sending event', { event });
      this.transportProvider.sendEvent(event);
    } catch (error) {
      HMSLogger.w(
        this.TAG,
        `${this.transportProvider.constructor.name}.sendEvent failed, adding to local storage events`,
        {
          event,
          error,
        },
      );
      this.failedEvents.enqueue(event);
      throw error;
    }
  }
}
