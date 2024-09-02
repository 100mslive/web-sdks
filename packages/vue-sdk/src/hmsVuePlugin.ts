import { App, AppConfig, computed, ref, UnwrapRef } from 'vue';
import { HMSReactiveStore, HMSStore } from '@100mslive/hms-video-store';

export const hmsVuePlugin = {
  install(app: App, _options: AppConfig) {
    const reactiveStore = new HMSReactiveStore<any>();
    reactiveStore.triggerOnSubscribe();
    const hmsStore = reactiveStore.getStore();
    const hmsActions = reactiveStore.getActions();
    type Selector<T> = (state: HMSStore<any>) => T;
    const useHMSStore = <T>(selector: Selector<T>) => {
      const selectedState = ref(hmsStore.getState(selector));

      // Subscribe to the Zustand store and trigger updates
      hmsStore.subscribe(newState => {
        selectedState.value = newState as UnwrapRef<T>;
      }, selector);

      return computed(() => selectedState.value);
    };

    app.provide('hmsActions', hmsActions);
    app.provide('useHMSStore', useHMSStore);
  },
};
