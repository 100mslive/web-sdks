import { SessionStoreUpdate } from '../internal';
import { IHMSSessionStoreActions } from '../schema';
import { HMSSdk } from '../sdk';

export class HMSSessionStore<T extends Record<string, any>> implements IHMSSessionStoreActions<T> {
  constructor(
    private sdk: HMSSdk,
    private setLocally: (updates: SessionStoreUpdate | SessionStoreUpdate[], actionName?: string) => void,
  ) {}

  private get sdkSessionStore() {
    return this.sdk.getSessionStore();
  }

  async set<K extends keyof T>(key: K, value?: T[K]) {
    const { value: latestValue } = await this.sdkSessionStore.set(String(key), value);
    this.setLocally({ key: key as string, value: latestValue });
  }

  async observe(keys: keyof T | Array<keyof T>) {
    const stringifiedKeys: string[] = Array.isArray(keys) ? keys.map(key => String(key)) : [String(keys)];
    await this.sdkSessionStore.observe(stringifiedKeys);
  }

  async unobserve(keys: keyof T | Array<keyof T>) {
    const stringifiedKeys: string[] = Array.isArray(keys) ? keys.map(key => String(key)) : [String(keys)];
    await this.sdkSessionStore.unobserve(stringifiedKeys);
  }
}
