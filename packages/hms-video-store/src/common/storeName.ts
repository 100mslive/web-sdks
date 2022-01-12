import { isBrowser } from '@100mslive/hms-video';

export const storeNameWithTabTitle = (storeName: string) => {
  return isBrowser ? `${storeName} ${document.title}` : storeName;
};

export const getInstanceIDforStore = (storeName: string) => {
  if (storeName.includes('HMSStore')) {
    return 1;
  } else if (storeName.includes('HMSStatsStore')) {
    return 2;
  } else {
    return 0;
  }
};
