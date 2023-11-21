import { isBrowser } from '../internal';

export const storeNameWithTabTitle = (storeName: string) => {
  return isBrowser ? `${storeName} ${document.title}` : storeName;
};
