import produce from 'immer';
import create, {
  StateSelector,
  StoreApi,
  SetState,
  StateSliceListener,
  EqualityChecker,
  PartialState,
  State,
} from 'zustand/vanilla';
import shallow from 'zustand/shallow';
import { HMSSdk } from '@100mslive/hms-video';
import { IHMSActions } from '../IHMSActions';
import { HMSSDKActions } from './HMSSDKActions';
import { IStore } from '../IHMSStore';
import { IHMSStore, IHMSStoreReadOnly } from '../IHMSStore';
import { createDefaultStoreState, HMSStore } from '../schema';
import { HMSNotifications } from './HMSNotifications';
import { IHMSNotifications } from '../IHMSNotifications';
import { NamedSetState } from './internalTypes';
import { HMSStats } from '../webrtc-stats';
import { getInstanceIDforStore, storeNameWithTabTitle } from '../../common/storeName';

declare global {
  interface Window {
    __hms: HMSReactiveStore;
  }
}

export class HMSReactiveStore {
  private readonly sdk?: HMSSdk;
  private readonly actions: IHMSActions;
  private readonly store: IHMSStore;
  private readonly notifications: HMSNotifications;
  private stats?: HMSStats;
  /** @TODO store flag for both HMSStore and HMSInternalsStore */
  private initialTriggerOnSubscribe: boolean;

  constructor(hmsStore?: IHMSStore, hmsActions?: IHMSActions, hmsNotifications?: HMSNotifications) {
    if (hmsStore) {
      this.store = hmsStore;
    } else {
      this.store = HMSReactiveStore.createNewHMSStore<HMSStore>(
        storeNameWithTabTitle('HMSStore'),
        createDefaultStoreState,
      );
    }
    if (hmsNotifications) {
      this.notifications = hmsNotifications;
    } else {
      this.notifications = new HMSNotifications(this.store);
    }
    if (hmsActions) {
      this.actions = hmsActions;
    } else {
      this.sdk = new HMSSdk();
      this.actions = new HMSSDKActions(this.store, this.sdk, this.notifications);
    }

    this.initialTriggerOnSubscribe = false;

    window.__hms = this;
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
    HMSReactiveStore.makeStoreTriggerOnSubscribe(this.store);
    this.initialTriggerOnSubscribe = true;
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
   *
   * @deprecated use getActions
   */
  getHMSActions(): IHMSActions {
    return this.actions;
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

  /**
   * @alpha
   * @internal
   */
  getStats = (): HMSStats => {
    if (!this.stats) {
      this.stats = new HMSStats(this.store, this.sdk);
    }
    return this.stats;
  };

  /**
   * @internal
   */
  static createNewHMSStore<T extends State>(storeName: string, defaultCreatorFn: () => T): IStore<T> {
    const hmsStore = create<T>(() => defaultCreatorFn());
    // make set state immutable, by passing functions through immer
    const savedSetState = hmsStore.setState;
    hmsStore.setState = (partial: any) => {
      const nextState = typeof partial === 'function' ? produce(partial) : partial;
      savedSetState(nextState);
    };
    // add option to pass selector to getState
    const prevGetState = hmsStore.getState;
    // eslint-disable-next-line complexity
    hmsStore.getState = <StateSlice>(selector?: StateSelector<T, StateSlice>) => {
      if (selector) {
        const name = selector.name || 'byIDSelector';
        // @ts-ignore
        if (!window.selectorsCount) {
          // @ts-ignore
          window.selectorsCount = {};
        }
        // @ts-ignore
        window.selectorsCount[name] = (window.selectorsCount[name] || 0) + 1;
        const start = performance.now();
        const updatedState = selector(prevGetState());
        const diff = performance.now() - start;
        // store selectors that take more than 1ms
        if (diff > 1) {
          // @ts-ignore
          window.expensiveSelectors = window.expensiveSelectors || new Map();
          // @ts-ignore
          window.expensiveSelectors.set(name, diff);
        }
        return updatedState;
      }
      return prevGetState();
    };
    HMSReactiveStore.useShallowCheckInSubscribe(hmsStore);
    const namedSetState = HMSReactiveStore.setUpDevtools(hmsStore, storeName);
    return { ...hmsStore, namedSetState };
  }

  /**
   * @internal
   */
  static makeStoreTriggerOnSubscribe<T extends State>(store: IStore<T>) {
    const prevSubscribe = store.subscribe;
    store.subscribe = <StateSlice>(
      listener: StateSliceListener<StateSlice>,
      selector?: StateSelector<T, StateSlice>,
      equalityFn?: EqualityChecker<StateSlice>,
    ): (() => void) => {
      // initial call, the prev state will always be null for this
      listener(store.getState(selector), undefined as unknown as StateSlice);
      // then subscribe
      return prevSubscribe(listener, selector!, equalityFn);
    };
  }

  /**
   * use shallow equality check by default for subscribe to optimize for array/object selectors.
   * by default zustand does only reference matching so something like, getPeers for eg. would trigger
   * the corresponding component even if peers didn't actually change, as selectPeers creates a new array everytime.
   * Although the array reference changes, the order of peers and peer objects don't themselves change in this case,
   * and a shallow check avoids that triggering.
   * @private
   */
  private static useShallowCheckInSubscribe<T extends State>(hmsStore: StoreApi<T>) {
    const prevSubscribe = hmsStore.subscribe;
    hmsStore.subscribe = <StateSlice>(
      listener: StateSliceListener<StateSlice>,
      selector?: StateSelector<T, StateSlice>,
      equalityFn?: EqualityChecker<StateSlice>,
    ): (() => void) => {
      if (!selector) {
        selector = (store): StateSlice => store as unknown as StateSlice;
      }
      equalityFn = equalityFn || shallow;
      return prevSubscribe(listener, selector, equalityFn);
    };
  }

  /**
   * @private
   * @privateRemarks
   * sets up redux devtools for the store, so redux extension can be used to visualize the store.
   * zustand's default devtool middleware only enhances the set function, we're here creating another nameSetState in
   * IHMStore which behaves like setState but takes an extra parameter for action name
   * https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md
   * modified version of zustand's devtools - https://github.com/pmndrs/zustand/blob/v3.5.7/src/middleware.ts#L46
   */
  private static setUpDevtools<T extends State>(api: StoreApi<T>, prefix: string): NamedSetState<T> {
    let extension;
    try {
      extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__ || (window as any).top.__REDUX_DEVTOOLS_EXTENSION__;
    } catch {}
    if (!extension) {
      return (fn: any) => {
        api.setState(fn);
      };
    }
    const devtools = extension.connect(HMSReactiveStore.devtoolsOptions(prefix, getInstanceIDforStore(prefix)));
    devtools.prefix = prefix ? `${prefix} > ` : '';
    const savedSetState = api.setState;
    api.setState = (fn: any) => {
      savedSetState(fn);
      devtools.send(`${devtools.prefix}setState`, api.getState());
    };

    devtools.subscribe(HMSReactiveStore.devtoolsSubscribe(devtools, api, savedSetState));

    devtools.send('setUpStore', api.getState());

    return (fn: any, action?: string) => {
      savedSetState(fn);
      const actionName = action ? action : `${devtools.prefix}action`;
      devtools.send(actionName, api.getState());
    };
  }

  /**
   * https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
   */
  private static devtoolsOptions(prefix: string, instanceId: number) {
    return {
      name: prefix,
      actionsBlacklist: ['audioLevel', 'playlistProgress'], // very high frequency update, pollutes the action history
      instanceId, // to uniquely identify each store in devtool
    };
  }

  /**
   * redux devtools allows for time travel debugging where it sends an action to update the store, users can
   * also export and import state in the devtools, listen to the corresponding functions from devtools and take
   * required action.
   * @param devtools - reference to devtools extension object
   * @param api
   * @param savedSetState - setState saved before its modified to update devtools
   * @private
   */
  private static devtoolsSubscribe<T extends State>(devtools: any, api: StoreApi<T>, savedSetState: SetState<T>) {
    // disabling complexity check instead of refactoring so as to keep the code close to zustand's and make
    // any future update based on upstream changes easier.
    // eslint-disable-next-line complexity
    return (message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        const ignoreState = ['JUMP_TO_ACTION', 'JUMP_TO_STATE'].includes(message.payload.type);
        if (!ignoreState) {
          // manual dispatch from the extension
          api.setState(JSON.parse(message.state));
        } else {
          // for time travel, no need to add new state changes in devtools
          savedSetState(JSON.parse(message.state));
        }
      } else if (message.type === 'DISPATCH' && message.payload?.type === 'COMMIT') {
        devtools.init(api.getState());
      } else if (message.type === 'DISPATCH' && message.payload?.type === 'IMPORT_STATE') {
        const actions = message.payload.nextLiftedState?.actionsById;
        const computedStates = message.payload.nextLiftedState?.computedStates || [];

        computedStates.forEach(({ state }: { state: PartialState<T> }, index: number) => {
          const action = actions[index] || `${devtools.prefix}setState`;
          if (index === 0) {
            devtools.init(state);
          } else {
            savedSetState(state);
            devtools.send(action, api.getState());
          }
        });
      }
    };
  }
}
