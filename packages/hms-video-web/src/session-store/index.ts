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
    const newObservedKeys = new Set(this.observedKeys);
    keys.forEach(key => newObservedKeys.add(key));

    if (this.observedKeys.size !== newObservedKeys.size) {
      await this.transport.listenMetadataChange(Array.from(newObservedKeys));
      this.observedKeys = newObservedKeys;
    }
  }

  async unobserve(keys: string[]) {
    const newObservedKeys = new Set([...this.observedKeys].filter(key => !keys.includes(key)));

    if (this.observedKeys.size !== newObservedKeys.size) {
      await this.transport.listenMetadataChange(Array.from(newObservedKeys));
      this.observedKeys = newObservedKeys;
    }
  }
}
