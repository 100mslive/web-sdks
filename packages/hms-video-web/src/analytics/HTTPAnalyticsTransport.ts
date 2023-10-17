import AnalyticsEvent from './AnalyticsEvent';
import { IAnalyticsTransportProvider } from './IAnalyticsTransportProvider';
import {
  CLIENT_ANAYLTICS_PROD_ENDPOINT,
  CLIENT_ANAYLTICS_QA_ENDPOINT,
  CLIENT_ANAYLTICS_STORAGE_LIMIT,
} from '../utils/constants';
import { LocalStorage } from '../utils/local-storage';
import HMSLogger from '../utils/logger';
import { ENV } from '../utils/support';

interface ClientEventBody {
  event: string;
  event_id: string;
  peer: {
    peer_id?: string;
    role?: string;
    joined_at?: number;
    left_at?: number;
    room_id?: string;
    room_name?: string;
    session_started_at?: number;
    user_data?: string;
    user_name?: string;
    template_id?: string;
    session_id?: string;
  };
  timestamp: number;
  cluster: {
    websocket_url: string;
  };
  payload: Record<string, any>;
  device_id: string;
}

class ClientAnalyticsTransport implements IAnalyticsTransportProvider {
  readonly TAG = '[HTTPAnalyticsTransport]';
  private failedEvents = new LocalStorage<AnalyticsEvent[]>('client-events');
  isConnected = true;
  private env: null | ENV = null;
  private websocketURL = '';

  setEnv(env: ENV) {
    this.env = env;
    this.flushFailedEvents();
  }

  setWebsocketEndpoint(ws: string) {
    this.websocketURL = ws;
  }

  sendEvent(event: AnalyticsEvent) {
    if (!this.env) {
      this.addEventToStorage(event);
      return;
    }
    const requestBody: ClientEventBody = {
      event: event.name,
      payload: event.properties,
      event_id: String(event.timestamp),
      peer: event.metadata.peer,
      timestamp: event.timestamp,
      device_id: event.device_id,
      cluster: {
        websocket_url: this.websocketURL,
      },
    };
    const url = this.env === ENV.PROD ? CLIENT_ANAYLTICS_PROD_ENDPOINT : CLIENT_ANAYLTICS_QA_ENDPOINT;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${event.metadata.token}`,
        user_agent_v2: event.metadata.userAgent,
      },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        // Ignore invalid token or expired token messages
        if (response.status === 401) {
          this.removeFromStorage(event);
          return;
        }
        if (response.status !== 200) {
          throw Error(response.statusText);
        }
        this.removeFromStorage(event);
      })
      .catch(error => {
        HMSLogger.v(this.TAG, 'Failed to send event', error, event);
        this.addEventToStorage(event);
      });
  }
  flushFailedEvents() {
    const events = this.failedEvents.get();
    events?.forEach(event => this.sendEvent(event));
  }

  private addEventToStorage(event: AnalyticsEvent): void {
    const existingEvents = this.failedEvents.get() || [];
    if (!existingEvents.find(existingEvent => existingEvent.timestamp === event.timestamp)) {
      if (existingEvents.length === CLIENT_ANAYLTICS_STORAGE_LIMIT) {
        existingEvents.shift();
      }
      existingEvents.push(event);
      this.failedEvents.set(existingEvents);
    }
  }

  private removeFromStorage(event: AnalyticsEvent): void {
    const events = this.failedEvents.get() || [];
    const index = events.findIndex(storageEvent => storageEvent.timestamp === event.timestamp);
    if (index > -1) {
      events.splice(index, 1);
      this.failedEvents.set(events);
    }
  }
}

export const HTTPAnalyticsTransport = new ClientAnalyticsTransport();
