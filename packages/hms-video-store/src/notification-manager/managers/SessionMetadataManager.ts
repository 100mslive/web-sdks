import { HMSUpdateListener, SessionStoreUpdate } from '../../interfaces';
import { Store } from '../../sdk/store';
import { convertDateNumToDate } from '../../utils/date';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { MetadataChangeNotification } from '../HMSNotifications';

export class SessionMetadataManager {
  constructor(private store: Store, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    if (method !== HMSNotificationMethod.METADATA_CHANGE) {
      return;
    }
    this.handleMetadataChange(notification);
  }

  private handleMetadataChange(notification: MetadataChangeNotification) {
    const updates: SessionStoreUpdate[] = notification.values.map(update => ({
      key: update.key,
      value: update.data,
      updatedAt: convertDateNumToDate(update.updated_at),
      updatedBy: update.updated_by ? this.store.getPeerById(update.updated_by) : undefined,
    }));
    this.listener?.onSessionStoreUpdate(updates);
  }
}
