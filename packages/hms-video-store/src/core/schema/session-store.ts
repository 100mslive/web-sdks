export interface IHMSSessionStoreActions<T> {
  set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
  observe<K extends keyof T>(key: K): Promise<T[K]>;
  unobserve<K extends keyof T>(key: K): Promise<void>;
}
