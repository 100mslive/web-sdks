import { isBrowser } from '@100mslive/hms-video';

export const storeNameWithTabTitle = (storeName: string) => {
  return isBrowser ? `${storeName} ${document.title}` : storeName;
};
