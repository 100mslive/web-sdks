import { LocalStorage } from '../utils/local-storage';
import HMSLogger from '../utils/logger';
import { userAgent } from '../utils/support';
import AnalyticsEvent from './AnalyticsEvent';

interface ClientEventBody {
  event: string;
  event_id: string;
  peer_id?: string;
  session_id?: string;
  timestamp: number;
  payload: Record<string, any>;
  agent: string;
  device_id: string;
}

export class ClientEventsManager {
  private TAG = 'ClientEventsManager';
  private failedEvents = new LocalStorage<AnalyticsEvent[]>('client-events');
  sendEvent(event: AnalyticsEvent) {
    const { token, peer_id, session_id, ...rest } = event.properties;
    const requestBody: ClientEventBody = {
      event: event.name,
      payload: rest,
      event_id: String(event.timestamp),
      peer_id,
      session_id,
      timestamp: Date.now(),
      agent: userAgent,
      device_id: event.device_id,
    };
    // 'https://event-nonprod.100ms.live/v2/client/report',
    fetch('https://qa-in2.100ms.live/reporter/v2/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        if (response.status !== 200) {
          throw Error(response.statusText);
        }
        const events = this.failedEvents.get() || [];
        const index = events.findIndex(storageEvent => storageEvent.timestamp === event.timestamp);
        if (index > -1) {
          events.splice(index, 1);
          this.failedEvents.set(events);
        }
      })
      .catch(error => {
        const existingEvents = this.failedEvents.get() || [];
        if (!existingEvents.find(existingEvent => existingEvent.timestamp === event.timestamp)) {
          existingEvents.push(event);
          this.failedEvents.set(existingEvents);
        }
        HMSLogger.e(this.TAG, 'Failed to send event', error, event);
      });
  }
  flushFailedEvents() {
    const events = this.failedEvents.get();
    events?.forEach(event => this.sendEvent(event));
  }
}
