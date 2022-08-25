import { HMSAnalyticsLevel } from './AnalyticsEventLevel';
import { ANALYTICS_BUFFER_SIZE } from '../utils/constants';
import HMSLogger from '../utils/logger';
import AnalyticsEvent from './AnalyticsEvent';
import { AnalyticsTransport } from './AnalyticsTransport';
import { IStore } from '../sdk/store';
import { HTTPAnalyticsTransport } from './HTTPAnalyticsTransport';

const TAG = 'AnalyticsEventsService';

export class AnalyticsEventsService {
  private bufferSize = ANALYTICS_BUFFER_SIZE;

  private transport: AnalyticsTransport | null = null;
  private pendingEvents: AnalyticsEvent[] = [];

  level: HMSAnalyticsLevel = HMSAnalyticsLevel.INFO;

  constructor(private store: IStore) {}

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

  flushFailedClientEvents() {
    HTTPAnalyticsTransport.flushFailedEvents();
  }

  // eslint-disable-next-line complexity
  flush() {
    try {
      while (this.pendingEvents.length > 0) {
        const event = this.pendingEvents.shift();
        if (event) {
          event.metadata.peer.peer_id = this.store.getLocalPeer()?.peerId;
          if (this.transport && this.transport.transportProvider.isConnected) {
            this.transport.sendEvent(event);
          } else {
            this.sendClientEventOnHTTP(event);
          }
        }
      }
    } catch (error) {
      HMSLogger.w(TAG, 'Flush Failed', error);
    }
  }

  private sendClientEventOnHTTP(event: AnalyticsEvent) {
    const room = this.store.getRoom();
    const localPeer = this.store.getLocalPeer();
    event.metadata.token = this.store.getConfig()?.authToken;
    event.metadata.peer = {
      session_id: room.sessionId,
      room_id: room.id,
      room_name: room.name,
      template_id: room.templateId,
      joined_at: room.joinedAt?.getTime(),
      session_started_at: room.startedAt?.getTime(),
      role: localPeer?.role?.name,
      user_name: localPeer?.name,
      user_data: localPeer?.metadata,
    };
    HTTPAnalyticsTransport.sendEvent(event);
  }
}
