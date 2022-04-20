import { v4 as uuid } from 'uuid';
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
  public TAG = 'ClientEventsManager';
  sendEvent(event: AnalyticsEvent) {
    const { token, peer_id, session_id, ...rest } = event.properties;
    const requestBody: ClientEventBody = {
      event: event.name,
      payload: rest,
      event_id: uuid(),
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
      .then(response => response.json())
      .then(res => {
        console.log(res);
      })
      .catch(console.error);
  }
}
