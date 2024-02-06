import { v4 as uuid } from 'uuid';
import { LocalStorage } from './local-storage';

export const getAnalyticsDeviceId = () => {
  let id;
  const storage = new LocalStorage<string>('hms-analytics-deviceId');
  const storageId = storage.get();
  if (storageId) {
    id = storageId;
  } else {
    id = uuid();
    storage.set(id);
  }
  return id;
};
