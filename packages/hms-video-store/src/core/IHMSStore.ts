import { HMSStore, HMSWebrtcInternalsStore } from './schema';
import { IStore, IStoreReadOnly } from './IStore';

/**
 * HMS Reactive store can be used to subscribe to different parts of the store using selectors
 * and get a callback when the value changes.
 */
export type IHMSStore = IStore<HMSStore>;

/**
 * HMS store can be used to:
 * - Get a part of the current store or state(getState)
 * - Subscribe to different parts of the store using selectors and execute a callback when the value changes.
 *
 * Both getState and subscribe use selectors to query a part the store.
 *
 *
 * Selectors are functions with HMSStore as an argument and returns a part of the store.
 *
 * **StoreSelector** is a type alias for this type of function.
 *
 * @category Core
 */
export type IHMSStoreReadOnly = IStoreReadOnly<HMSStore>;

export type IHMSWebrtcInternalsStore = IStore<HMSWebrtcInternalsStore>;
export type IHMSWebrtcInternalsStoreReadOnly = IStoreReadOnly<HMSWebrtcInternalsStore>;
