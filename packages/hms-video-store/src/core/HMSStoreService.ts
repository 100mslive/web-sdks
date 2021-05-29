import create, { SetState } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createDefaultStoreState, HMSStore } from './schema';
import produce from 'immer';
import { GetState, StoreApi } from 'zustand/vanilla';
import { registerSelectorTools } from './selectors/setUpSelectorTools';

const immer = <T extends HMSStore>(
  outerFn: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T,
) => {
  return (set: SetState<T>, get: GetState<T>, api: StoreApi<T>): T => {
    // wrap set methods to use immer curry for immutability
    const newSet = (fn: any) => set(produce<T>(fn));
    return outerFn(newSet, get, api);
  };
};

// One store is required per room
export const createNewStore = () => {
  const hmsStore = create<HMSStore>(
    devtools(
      immer(() => createDefaultStoreState()),
      'HMSStore',
    ),
  );
  // make set state immutable
  const prevSetState = hmsStore.setState;
  hmsStore.setState = (fn: any) => prevSetState(produce(fn));
  return hmsStore;
};

registerSelectorTools();
