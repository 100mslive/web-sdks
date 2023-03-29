import { HMSSessionStore } from '../interfaces';
import ITransport from '../transport/ITransport';
import { convertDateNumToDate } from '../utils/date';

export class SessionStore implements HMSSessionStore {
  private observedKeys: string[] = [];

  constructor(private transport: ITransport) {}

  async get(key: string) {
    const { data, updated_at } = await this.transport.getSessionMetadata(key);

    return { value: data, updatedAt: convertDateNumToDate(updated_at) };
  }

  async set(key: string, data: any) {
    const { data: value, updated_at } = await this.transport.setSessionMetadata({ key, data });
    const updatedAt = convertDateNumToDate(updated_at);
    return { value, updatedAt };
  }

  async observe(key: string) {
    if (this.observedKeys.includes(key)) {
      return;
    }

    await this.transport.listenMetadataChange([...this.observedKeys, key]);
    this.observedKeys.push(key);
  }

  async unobserve(key: string) {
    if (!this.observedKeys.includes(key)) {
      return;
    }

    await this.transport.listenMetadataChange(this.observedKeys.filter(existingKey => existingKey !== key));
    this.observedKeys = this.observedKeys.filter(existingKey => existingKey !== key);
  }
}
