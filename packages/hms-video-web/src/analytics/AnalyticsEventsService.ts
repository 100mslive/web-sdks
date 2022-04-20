import { HMSAnalyticsLevel } from './AnalyticsEventLevel';
import { ANALYTICS_BUFFER_SIZE } from '../utils/constants';
import HMSLogger from '../utils/logger';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsTransport } from './AnalyticsTransport';

const TAG = 'AnalyticsEventsService';

export class AnalyticsEventsService {
  private bufferSize = ANALYTICS_BUFFER_SIZE;

  private transport: AnalyticsTransport | null = null;
  private pendingEvents: AnalyticsEvent[] = [];

  level: HMSAnalyticsLevel = HMSAnalyticsLevel.INFO;

  setTransport(transport: AnalyticsTransport) {
    this.transport = transport;
  }

  reset() {
    this.transport = null;
    this.pendingEvents = [];
  }

  queue(event: AnalyticsEvent) {
    if (event.level >= this.level) {
      this.pendingEvents.push(event);

      if (this.pendingEvents.length > this.bufferSize) {
        const removedEvent = this.pendingEvents.shift();
        HMSLogger.d(TAG, 'Max buffer size reached', 'Removed event to accommodate new events', removedEvent);
      }
    }
    return this;
  }

  flush() {
    if (!this.transport) {
      HMSLogger.w(TAG, 'No valid signalling API found to flush analytics');
      return;
    }

    try {
      while (this.pendingEvents.length > 0) {
        const event = this.pendingEvents.shift();
        if (event) {
          this.transport.sendEvent(event);
        }
      }
    } catch (error) {
      HMSLogger.w(TAG, 'Flush Failed', error);
    }
  }
}
