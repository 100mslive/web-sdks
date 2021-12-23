import { isBrowser } from '@100mslive/hms-video';

export const storeNameWithTabTitle = (storeName: string) => {
  let appName: string;
  if (window.location.host.includes('localhost')) {
    appName = 'localhost';
  } else {
    appName = window.location.host.split('.')[0];
  }
  return isBrowser ? `${storeName} ${document.title}(${appName})` : storeName;
};
