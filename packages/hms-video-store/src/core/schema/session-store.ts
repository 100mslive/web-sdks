export interface IHMSSessionStoreActions<T> {
  set<K extends keyof T>(key: K, value: T[K]): Promise<void>;
  observe(key: keyof T | Array<keyof T>): Promise<void>;
  unobserve(key: keyof T): Promise<void>;
}
