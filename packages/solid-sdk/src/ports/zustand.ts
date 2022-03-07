/* eslint-disable complexity */
import { createEffect, createRenderEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import createZustandStore, {
  EqualityChecker,
  GetState,
  SetState,
  State,
  StateCreator,
  StateSelector,
  StoreApi,
} from 'zustand/vanilla';

// For server-side rendering: https://github.com/pmndrs/zustand/pull/34
// Deno support: https://github.com/pmndrs/zustand/issues/347
const isSSR =
  typeof window === 'undefined' || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent);

const useIsomorphicLayoutEffect = isSSR ? createEffect : createRenderEffect;

const useReducer = <S>(reducer: (s: S) => S, initState: S) => {
  const [store, setStore] = createStore<S>(initState);
  const dispatch = () => {
    const nextStore = reducer(store as S);
    setStore(reconcile(nextStore));
  };
  return [store, dispatch];
};

/**
 * @deprecated Please use UseBoundStore instead
 */
export type UseStore<T extends State, CustomStoreApi extends StoreApi<T> = StoreApi<T>> = {
  (): T;
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U;
} & CustomStoreApi;

export type UseBoundStore<T extends State, CustomStoreApi extends StoreApi<T> = StoreApi<T>> = {
  (): T;
  <U>(selector: StateSelector<T, U>, equalityFn?: EqualityChecker<U>): U;
} & CustomStoreApi;

function create<TState extends State, CustomSetState, CustomGetState, CustomStoreApi extends StoreApi<TState>>(
  createState: StateCreator<TState, CustomSetState, CustomGetState, CustomStoreApi> | CustomStoreApi,
): UseBoundStore<TState, CustomStoreApi>;

function create<TState extends State>(
  createState: StateCreator<TState, SetState<TState>, GetState<TState>, any> | StoreApi<TState>,
): UseBoundStore<TState, StoreApi<TState>>;

function create<TState extends State, CustomSetState, CustomGetState, CustomStoreApi extends StoreApi<TState>>(
  createState: StateCreator<TState, CustomSetState, CustomGetState, CustomStoreApi> | CustomStoreApi,
): UseBoundStore<TState, CustomStoreApi> {
  const api: CustomStoreApi = typeof createState === 'function' ? createZustandStore(createState) : createState;

  const useStore: any = <StateSlice>(
    selector: StateSelector<TState, StateSlice> = api.getState as any,
    equalityFn: EqualityChecker<StateSlice> = Object.is,
  ) => {
    const [, forceUpdate] = useReducer(c => c + 1, 0) as [never, () => void];

    const state = api.getState();
    let stateRef: TState = state;
    let selectorRef: StateSelector<TState, StateSlice> = selector;
    let equalityFnRef: EqualityChecker<StateSlice> = equalityFn;
    let erroredRef = false;

    let currentSliceRef: StateSlice = selector(state);
    if (currentSliceRef === undefined) {
      currentSliceRef = selector(state);
    }

    let newStateSlice: StateSlice | undefined;
    let hasNewStateSlice = false;

    // The selector or equalityFn need to be called during the render phase if
    // they change. We also want legitimate errors to be visible so we re-run
    // them if they errored in the subscriber.
    if (stateRef !== state || selectorRef !== selector || equalityFnRef !== equalityFn || erroredRef) {
      // Using local variables to avoid mutations in the render phase.
      newStateSlice = selector(state);
      hasNewStateSlice = !equalityFn(currentSliceRef, newStateSlice);
    }

    // Syncing changes in useEffect.
    useIsomorphicLayoutEffect(() => {
      if (hasNewStateSlice) {
        currentSliceRef = newStateSlice as StateSlice;
      }
      stateRef = state;
      selectorRef = selector;
      equalityFnRef = equalityFn;
      erroredRef = false;
    });

    const stateBeforeSubscriptionRef: TState = state;
    useIsomorphicLayoutEffect(() => {
      const listener = () => {
        try {
          const nextState = api.getState();
          const nextStateSlice = selectorRef(nextState);
          if (!equalityFnRef(currentSliceRef as StateSlice, nextStateSlice)) {
            stateRef = nextState;
            currentSliceRef = nextStateSlice;
            forceUpdate();
          }
        } catch (error) {
          erroredRef = true;
          forceUpdate();
        }
      };
      const unsubscribe = api.subscribe(listener);
      if (api.getState() !== stateBeforeSubscriptionRef) {
        listener(); // state has changed before subscription
      }
      return unsubscribe;
    }, []);

    const sliceToReturn = hasNewStateSlice ? (newStateSlice as StateSlice) : currentSliceRef;
    // useDebugValue(sliceToReturn);
    return sliceToReturn;
  };

  Object.assign(useStore, api);

  // For backward compatibility (No TS types for this)
  useStore[Symbol.iterator] = function () {
    console.warn('[useStore, api] = create() is deprecated and will be removed in v4');
    const items = [useStore, api];
    return {
      next() {
        const done = items.length <= 0;
        return { value: items.shift(), done };
      },
    };
  };

  return useStore;
}

export default create;
