import { devtools } from 'zustand/middleware';
import produce from 'immer';
import create, {
  GetState,
  StateSelector,
  StoreApi,
  SetState,
  StateSliceListener,
  EqualityChecker,
} from 'zustand/vanilla';
import shallow from 'zustand/shallow';
import { HMSSdk } from '@100mslive/hms-video';
import { IHMSActions } from '../IHMSActions';
import { HMSSDKActions } from './HMSSDKActions';
import { IHMSStore } from '../IHMSStore';
import { createDefaultStoreState, HMSStore } from '../schema';
import { HMSNotifications } from './HMSNotifications';
import { IHMSNotifications } from '../IHMSNotifications';
import { HMSLogger } from '../../common/ui-logger';

export class HMSReactiveStore {
  private readonly actions: IHMSActions;
  private readonly store: IHMSStore;
  private readonly notifications: HMSNotifications;
  private initialTriggerOnSubscribe: boolean;

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
    this.initialTriggerOnSubscribe = false;
  }

  /**
   * By default store.subscribe does not call the handler with the current state at time of subscription,
   * this behaviour can be modified by calling this function. What it means is that instead of calling the
   * handler only for changes which happen post subscription we'll also call it exactly once at the time
   * of subscription with the current state. This behaviour is similar to that of BehaviourSubject in rxjs.
   * This will be an irreversible change
   *
   * Note: you don't need this if you're using our react hooks, it takes care of this requirement.
   */
  triggerOnSubscribe(): void {
    if (this.initialTriggerOnSubscribe) {
      // already done
      return;
    }
    HMSLogger.d('turning on trigger on subscribe');
    HMSReactiveStore.makeStoreTriggerOnSubscribe(this.store);
    this.initialTriggerOnSubscribe = true;
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
    // use shallow equality check by default for subscribe to optimize for array/object selectors
    const prevSubscribe = hmsStore.subscribe;
    hmsStore.subscribe = <StateSlice>(
      listener: StateSliceListener<StateSlice>,
      selector?: StateSelector<HMSStore, StateSlice>,
      equalityFn?: EqualityChecker<StateSlice>,
    ): (() => void) => {
      if (!selector) {
        selector = (store): StateSlice => (store as unknown) as StateSlice;
      }
      equalityFn = equalityFn || shallow;
      return prevSubscribe(listener, selector, equalityFn);
    };
    return hmsStore;
  }

  static makeStoreTriggerOnSubscribe(store: IHMSStore) {
    const prevSubscribe = store.subscribe;
    store.subscribe = <StateSlice>(
      listener: StateSliceListener<StateSlice>,
      selector?: StateSelector<HMSStore, StateSlice>,
      equalityFn?: EqualityChecker<StateSlice>,
    ): (() => void) => {
      // initial call, the prev state will always be null for this
      listener(store.getState(selector), (undefined as unknown) as StateSlice);
      // then subscribe
      return prevSubscribe(listener, selector!, equalityFn);
    };
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
