import { HMSGenericTypes, HMSNotifications, IHMSNotifications, IHMSStore } from '../../core';
import { IHMSActions } from '../../core/IHMSActions';
import { IHMSStoreReadOnly } from '../../core/IHMSStore';

/**
 * @internal
 */
export class BeamControllerStore<T extends HMSGenericTypes = { sessionStore: Record<string, any> }> {
  // perform action to add, remove beam
  private readonly actions: IHMSActions<T>;
  // get all details from store about room, peers, tracks.
  private readonly store: IHMSStore<T>;
  // all details from the notification
  private readonly notifications: HMSNotifications;

  constructor(hmsStore: IHMSStore<T>, hmsActions: IHMSActions<T>, hmsNotifications: HMSNotifications) {
    this.store = hmsStore;
    this.actions = hmsActions;
    this.notifications = hmsNotifications;
  }

  /**
   * A reactive store which has a subscribe method you can use in combination with selectors
   * to subscribe to a subset of the store. The store serves as a single source of truth for
   * all data related to the corresponding HMS Room.
   */
  getStore(): IHMSStoreReadOnly {
    return this.store;
  }

  /**
   * Any action which may modify the store or may need to talk to the SDK will happen
   * through the IHMSActions instance returned by this
   */
  getActions(): IHMSActions {
    return this.actions;
  }

  /**
   * This return notification handler function to which you can pass your callback to
   * receive notifications like peer joined, peer left, etc. to show in your UI or use
   * for analytics
   */
  getNotifications(): IHMSNotifications {
    return { onNotification: this.notifications.onNotification };
  }
}
