import { ENV } from '../sdk/store/IStore';
import { LocalStorage } from '../utils/local-storage';
import HMSLogger from '../utils/logger';
import { userAgent } from '../utils/support';
import AnalyticsEvent from './AnalyticsEvent';
import { IAnalyticsTransportProvider } from './IAnalyticsTransportProvider';

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

export class HTTPAnalyticsTransport implements IAnalyticsTransportProvider {
  TAG = '[HTTPAnalyticsTransport]';
  private failedEvents = new LocalStorage<AnalyticsEvent[]>('client-events');
  private env: ENV = ENV.PROD;
  isConnected = true;
  setEnv(env: ENV) {
    this.env = env;
  }
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
    const url =
      this.env === ENV.PROD
        ? 'https://event.100ms.live/v2/client/report'
        : 'https://event-nonprod.100ms.live/v2/client/report';
    fetch(url, {
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
        HMSLogger.v(this.TAG, 'Failed to send event', error, event);
      });
  }
  flushFailedEvents() {
    const events = this.failedEvents.get();
    events?.forEach(event => this.sendEvent(event));
  }
}
