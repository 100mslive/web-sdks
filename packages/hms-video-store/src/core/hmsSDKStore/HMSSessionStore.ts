import { HMSSdk } from '@100mslive/hms-video';
import { IHMSSessionStoreActions } from '../schema';

export class HMSSessionStore<T extends Record<string, any>> implements IHMSSessionStoreActions<T> {
  constructor(
    private sdk: HMSSdk,
    private setLocally: <K extends keyof T>(key: K, value: T[K], actionName?: string) => void,
  ) {}

  private get sdkSessionStore() {
    return this.sdk.getSessionStore();
  }

  async set<K extends keyof T>(key: K, value: T[K]) {
    const { value: latestValue } = await this.sdkSessionStore.set(String(key), value);
    this.setLocally(key, latestValue);
  }

  async observe<K extends keyof T>(key: K) {
    await this.sdkSessionStore.observe(String(key));
    const { value } = await this.sdkSessionStore.get(String(key));
    if (value) {
      this.setLocally(key, value);
    }

    return value;
  }

  async unobserve<K extends keyof T>(key: K) {
    await this.sdkSessionStore.unobserve(String(key));
  }
}
