import { ANALYTICS_BUFFER_SIZE } from '../../utils/constants';
import { LocalStorage } from '../../utils/local-storage';
import { Queue } from '../../utils/queue';
import AnalyticsEvent from '../AnalyticsEvent';

export class LocalStorageEvents extends Queue<AnalyticsEvent> {
  private localStorage = new LocalStorage<AnalyticsEvent[]>('hms-analytics');

  constructor() {
    super(ANALYTICS_BUFFER_SIZE);
    // @TODO: Currently we don't send failed events of old sessions. So reset localstorage for every session.
    // Once support for failed events from old sessions is added, remove clear and init queue from localstorage.
    this.localStorage.clear();
    this.initLocalStorageQueue();
  }

  enqueue(event: AnalyticsEvent) {
    super.enqueue(event);
    this.localStorage.set(this.storage);
  }

  dequeue() {
    const removedEvent = super.dequeue();
    this.localStorage.set(this.storage);
    return removedEvent;
  }

  private initLocalStorageQueue() {
    this.localStorage.get()?.forEach(event => {
      const eventInstance = new AnalyticsEvent(event);
      super.enqueue(eventInstance);
    });
  }
}
