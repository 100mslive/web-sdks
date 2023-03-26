import { HMSUpdateListener, SessionStoreUpdate } from '../../interfaces';
import { IStore } from '../../sdk/store';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { MetadataChangeNotification } from '../HMSNotifications';

export class SessionMetadataManager {
  constructor(private store: IStore, private listener?: HMSUpdateListener) {}

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
      updatedAt: new Date(update.updated_at),
      updatedBy: this.store.getPeerById(update.updated_by),
    }));
    this.listener?.onSessionStoreUpdate(updates);
  }
}
