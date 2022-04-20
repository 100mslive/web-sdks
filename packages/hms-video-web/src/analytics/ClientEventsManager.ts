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
    };
    fetch('https://event-nonprod.100ms.live/v2/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        if (response.status !== 200) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .catch(error => {
        const existingEvents = this.failedEvents.get() || [];
        existingEvents.push(event);
        this.failedEvents.set(existingEvents);
        HMSLogger.e(this.TAG, 'Failed to send event', error, event);
      });
  }
  flushFailedEvents() {
    const events = this.failedEvents.get();
    events?.forEach(event => this.sendEvent(event));
  }
}
