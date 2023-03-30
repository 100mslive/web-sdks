import { HMSSessionStore, SessionStoreListener, SessionStoreUpdate } from '../interfaces';
import ITransport from '../transport/ITransport';
import { convertDateNumToDate } from '../utils/date';

export class SessionStore implements HMSSessionStore {
  private observedKeys: Set<string> = new Set();

  constructor(private transport: ITransport, private listener?: SessionStoreListener) {}

  setListener(listener?: SessionStoreListener) {
    this.listener = listener;
  }

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

    const updates: SessionStoreUpdate[] = [];
    for (const key of keys) {
      const { value } = await this.get(String(key));
      updates.push({ key, value });
    }

    this.listener?.onSessionStoreUpdate(updates);
  }

  async unobserve(keys: string[]) {
    const newObservedKeys = new Set(this.observedKeys);
    let hasChanged = false;
    keys.forEach(key => (hasChanged = newObservedKeys.delete(key) || hasChanged));

    if (hasChanged) {
      await this.transport.listenMetadataChange(Array.from(newObservedKeys));
      this.observedKeys = newObservedKeys;
    }
  }
}
