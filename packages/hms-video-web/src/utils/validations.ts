import HMSLogger from './logger';
import { ErrorFactory } from '../error/ErrorFactory';

const TAG = `[VALIDATIONS]`;

/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isPresent(value: any) {
  return value !== undefined && value !== null;
}

/**
 * checks if RTCPeerConnection constructor is available
 */
export const validateRTCPeerConnection = () => {
  if (!isPresent(RTCPeerConnection)) {
    const error = ErrorFactory.GenericErrors.MissingRTCPeerConnection();
    HMSLogger.e(TAG, error);
    throw error;
  }
};

/**
 * navigator.mediaDevices is undefined in insecure contexts served over HTTP protocol
 */
export const validateMediaDevicesExistence = () => {
  if (!isPresent(navigator.mediaDevices)) {
    const error = ErrorFactory.GenericErrors.MissingMediaDevices();
    HMSLogger.e(TAG, error);
    throw error;
  }
};
