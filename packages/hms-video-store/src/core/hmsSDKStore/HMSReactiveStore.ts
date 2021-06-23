import { devtools } from 'zustand/middleware';
import produce from 'immer';
import create, { GetState, StateSelector, StoreApi, SetState } from 'zustand/vanilla';
import { HMSSdk } from '@100mslive/hms-video';
import { IHMSActions } from '../IHMSActions';
import { HMSSDKActions } from './HMSSDKActions';
import { IHMSStore } from '../IHMSStore';
import { createDefaultStoreState, HMSStore } from '../schema';
import { HMSNotifications } from './HMSNotifications';
import { IHMSNotifications } from '../IHMSNotifications';

export class HMSReactiveStore {
  private readonly actions: IHMSActions;
  private readonly store: IHMSStore;
  private readonly notifications: HMSNotifications;

  constructor(hmsStore?: IHMSStore, hmsActions?: IHMSActions, hmsNotifications?: HMSNotifications) {
    if (hmsStore) {
      this.store = hmsStore;
    } else {
      this.store = HMSReactiveStore.createNewHMSStore();
    }
    if (hmsNotifications) {
      this.notifications = hmsNotifications;
    } else {
      this.notifications = new HMSNotifications(this.store);
    }
    if (hmsActions) {
      this.actions = hmsActions;
    } else {
      this.actions = new HMSSDKActions(this.store, new HMSSdk(), this.notifications);
    }
  }

  /**
   * A reactive store which has a subscribe method you can use in combination with selectors
   * to subscribe to a subset of the store. The store serves as a single source of truth for
   * all data related to the corresponding HMS Room.
   */
  getStore(): IHMSStore {
    const setStateError = () => {
      throw new Error('Mutating store is not allowed');
    };
    return { ...this.store, setState: setStateError };
  }

  /**
   * Any action which may modify the store or may need to talk to the SDK will happen
   * through the IHMSActions instance returned by this
   */
  getHMSActions(): IHMSActions {
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

  static createNewHMSStore(): IHMSStore {
    const hmsStore = create<HMSStore>(
      devtools(
        HMSReactiveStore.immerMiddleware(() => createDefaultStoreState()),
        'HMSStore',
      ),
    );
    // make set state immutable
    const prevSetState = hmsStore.setState;
    hmsStore.setState = (fn: any) => prevSetState(produce(fn));
    // add option to pass selector to getState
    const prevGetState = hmsStore.getState;
    hmsStore.getState = <StateSlice>(selector?: StateSelector<HMSStore, StateSlice>) => {
      return selector ? selector(prevGetState()) : prevGetState();
    };
    return hmsStore;
  }

  /**
   * Immer is used to maintain immutability of the core store
   * @param outerFn
   */
  private static immerMiddleware<T extends HMSStore>(
    outerFn: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T,
  ) {
    return (set: SetState<T>, get: GetState<T>, api: StoreApi<T>): T => {
      // wrap set methods to use immer curry for immutability
      const newSet = (fn: any) => set(produce<T>(fn));
      return outerFn(newSet, get, api);
    };
  }
}
