import { isPresent } from './presence';

/**
 * navigator.mediaDevices is undefined in insecure contexts served over HTTP protocol
 */
export const isMediadevicesMissing = () => !isPresent(navigator.mediaDevices);
