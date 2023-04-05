export interface IHMSSessionStoreActions<T> {
  set<K extends keyof T>(key: K, value?: T[K]): Promise<void>;
  /**
   * observe a particular key or set of keys to receive updates of its latest value when its changed
   */
  observe(keys: keyof T | Array<keyof T>): Promise<void>;
  /**
   * unobserve a particular key or set of keys to stop receiving updates of its latest value
   */
  unobserve(keys: keyof T | Array<keyof T>): Promise<void>;
}
