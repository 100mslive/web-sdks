import { HMSAnalyticsLevel } from './AnalyticsEventLevel';
import { ANALYTICS_BUFFER_SIZE } from '../utils/constants';
import HMSLogger from '../utils/logger';
import AnalyticsEvent from './AnalyticsEvent';
import { IAnalyticsTransport } from './IAnalyticsTransport';

const TAG = 'AnalyticsEventsService';

export class AnalyticsEventsService {
  private bufferSize = ANALYTICS_BUFFER_SIZE;

  private transports: IAnalyticsTransport[] = [];
  private pendingEvents: AnalyticsEvent[] = [];

  level: HMSAnalyticsLevel = HMSAnalyticsLevel.ERROR;

  addTransport(transport: IAnalyticsTransport) {
    this.transports.push(transport);
  }

  removeTransport(transport: IAnalyticsTransport) {
    this.transports.splice(this.transports.indexOf(transport), 1);
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
    if (this.transports.length === 0) {
      HMSLogger.w(TAG, 'No valid signalling API found to flush analytics');
      return;
    }

    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      if (event) {
        this.transports.forEach((transport) => transport.sendEvent(event));
      }
    }
  }
}

const analyticsEventsService = new AnalyticsEventsService();
export default analyticsEventsService;
