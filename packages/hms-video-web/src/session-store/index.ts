import { HMSSessionStore } from '../interfaces';
import ITransport from '../transport/ITransport';
import { convertDateNumToDate } from '../utils/date';

export class SessionStore implements HMSSessionStore {
  private observedKeys: Set<string> = new Set();

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

  async observe(keys: string[]) {
    const prevObservedKeys = new Set(this.observedKeys);
    keys.forEach(key => this.observedKeys.add(key));

    if (this.observedKeys.size !== prevObservedKeys.size) {
      try {
        await this.transport.listenMetadataChange(this.getListenMetadataChangeParams());
      } catch (e) {
        this.observedKeys = prevObservedKeys;
        throw e;
      }
    }
  }

  async unobserve(keys: string[]) {
    const prevObservedKeys = new Set(this.observedKeys);
    this.observedKeys = new Set([...this.observedKeys].filter(key => !keys.includes(key)));

    if (this.observedKeys.size !== prevObservedKeys.size) {
      try {
        await this.transport.listenMetadataChange(this.getListenMetadataChangeParams());
      } catch (e) {
        this.observedKeys = prevObservedKeys;
        throw e;
      }
    }
  }

  private getListenMetadataChangeParams() {
    const observedKeys = Array.from(this.observedKeys);
    const keys = observedKeys.filter(key => !key.includes('*'));
    const match = observedKeys.filter(key => key.includes('*'));

    return {
      keys: keys.length > 0 ? keys : undefined,
      match: match.length > 0 ? match : undefined,
    };
  }
}
