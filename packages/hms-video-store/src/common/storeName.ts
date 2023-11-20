import { isBrowser } from '../coreSDK';

export const storeNameWithTabTitle = (storeName: string) => {
  return isBrowser ? `${storeName} ${document.title}` : storeName;
};
