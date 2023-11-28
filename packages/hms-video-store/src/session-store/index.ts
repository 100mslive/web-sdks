import { HMSSessionStore } from '../interfaces';
import HMSTransport from '../transport';
import { convertDateNumToDate } from '../utils/date';

export class SessionStore implements HMSSessionStore {
  private observedKeys: Set<string> = new Set();

  constructor(private transport: HMSTransport) {}

  async get(key: string) {
    const { data, updated_at } = await this.transport.signal.getSessionMetadata(key);

    return { value: data, updatedAt: convertDateNumToDate(updated_at) };
  }

  async set(key: string, data: any) {
    const { data: value, updated_at } = await this.transport.signal.setSessionMetadata({ key, data });
    const updatedAt = convertDateNumToDate(updated_at);
    return { value, updatedAt };
  }

  async observe(keys: string[]) {
    const prevObservedKeys = new Set(this.observedKeys);
    keys.forEach(key => this.observedKeys.add(key));

    if (this.observedKeys.size !== prevObservedKeys.size) {
      try {
        await this.transport.signal.listenMetadataChange(Array.from(this.observedKeys));
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
        await this.transport.signal.listenMetadataChange(Array.from(this.observedKeys));
      } catch (e) {
        this.observedKeys = prevObservedKeys;
        throw e;
      }
    }
  }
}
