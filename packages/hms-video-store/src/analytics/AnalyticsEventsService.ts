import AnalyticsEvent from './AnalyticsEvent';
import { HMSAnalyticsLevel } from './AnalyticsEventLevel';
import { AnalyticsTransport } from './AnalyticsTransport';
import { HTTPAnalyticsTransport } from './HTTPAnalyticsTransport';
import { Store } from '../sdk/store';
import { ANALYTICS_BUFFER_SIZE } from '../utils/constants';
import HMSLogger from '../utils/logger';

export class AnalyticsEventsService {
  private bufferSize = ANALYTICS_BUFFER_SIZE;
  private readonly TAG = '[AnalyticsEventsService]';

  private transport: AnalyticsTransport | null = null;
  private pendingEvents: AnalyticsEvent[] = [];

  level: HMSAnalyticsLevel = HMSAnalyticsLevel.INFO;

  constructor(private store: Store) {}

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
        HMSLogger.d(this.TAG, 'Max buffer size reached', 'Removed event to accommodate new events', removedEvent);
      }
    }
    return this;
  }

  flushFailedClientEvents() {
    HTTPAnalyticsTransport.flushFailedEvents();
  }

  flush() {
    try {
      while (this.pendingEvents.length > 0) {
        const event = this.pendingEvents.shift();
        if (event) {
          event.metadata.peer.peer_id = this.store.getLocalPeer()?.peerId;
          event.metadata.userAgent = this.store.getUserAgent();
          if (this.transport && this.transport.transportProvider.isConnected) {
            this.transport.sendEvent(event);
          } else {
            this.sendClientEventOnHTTP(event);
          }
        }
      }
    } catch (error) {
      HMSLogger.w(this.TAG, 'Flush Failed', error);
    }
  }

  private sendClientEventOnHTTP(event: AnalyticsEvent) {
    const room = this.store.getRoom();
    const localPeer = this.store.getLocalPeer();
    event.metadata.token = this.store.getConfig()?.authToken;
    event.metadata.peer = {
      session_id: room?.sessionId,
      room_id: room?.id,
      room_name: room?.name,
      template_id: room?.templateId,
      joined_at: room?.joinedAt?.getTime(),
      session_started_at: room?.startedAt?.getTime(),
      role: localPeer?.role?.name,
      user_name: localPeer?.name,
      user_data: localPeer?.metadata,
      peer_id: localPeer?.peerId,
    };
    HTTPAnalyticsTransport.sendEvent(event);
  }
}
