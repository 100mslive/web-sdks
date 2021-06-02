import { IHMSActions } from '../IHMSActions';
import { HMSSDKActions } from './HMSSDKActions';
import { HMSSdk } from '@100mslive/hms-video';
import { IHMSStore } from '../IHMSStore';
import create, { SetState } from 'zustand/vanilla';
import { createDefaultStoreState, HMSStore } from '../schema';
import { devtools } from 'zustand/middleware';
import produce from 'immer';
import { GetState, StateSelector, StoreApi } from 'zustand/vanilla';

export class HMSReactiveStore {
  private readonly hmsActions: IHMSActions;
  private readonly store: IHMSStore;

  constructor(hmsStore?: IHMSStore, hmsActions?: IHMSActions) {
    if (hmsStore) {
      this.store = hmsStore;
    } else {
      this.store = HMSReactiveStore.createNewHMSStore();
    }
    if (hmsActions) {
      this.hmsActions = hmsActions;
    } else {
      this.hmsActions = new HMSSDKActions(this.store, new HMSSdk());
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
    return this.hmsActions;
  }

  /**
   * you can subscribe to notifications for new message, peer add etc. using this function.
   * note that this is not meant to maintain any state on your side, as the reactive store already
   * does that. The intent of this function is mainly to display toast notifications or send analytics.
   * We'll provide a display message which can be displayed as it is for common cases.
   */
  onNotification() {
    throw new Error('Not yet implemented');
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
