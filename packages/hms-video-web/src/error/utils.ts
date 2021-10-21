import adapter from 'webrtc-adapter';
import { ErrorFactory, HMSAction } from './ErrorFactory';
import { HMSException } from './HMSException';

export enum HMSGetMediaActions {
  AUDIO = 'audio',
  VIDEO = 'video',
  AV = 'audio, video',
  SCREEN = 'screen',
}

/**
 * # Edge Cases:
 * - Screenshare error: The problem is when block at OS level, chrome throws NotAllowedError(HMS code - 3001) while firefox throws NotFoundError(HMS code - 3002),
 * we will handle this internally and throw error as User block - 3001 and OS block - 3002 for all browsers.
 * Chrome -
 * User blocked - NotAllowedError - Permission denied
 * System blocked - NotAllowedError - Permission denied by system
 */
function convertMediaErrorToHMSException(err: Error, deviceInfo: string): HMSException {
  const message = err.message.toLowerCase();

  /**
   * Note: Adapter detects all chromium browsers as 'chrome'
   */
  if (
    deviceInfo === 'screen' &&
    adapter.browserDetails.browser === 'chrome' &&
    err.name === 'NotAllowedError' &&
    err.message.includes('denied by system')
  ) {
    return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, err.message);
  }

  switch (err.name) {
    case 'OverconstrainedError':
      return ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, err.message);
    case 'NotAllowedError':
      return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, err.message);
    case 'NotFoundError':
      return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, err.message);
    case 'NotReadableError':
      return ErrorFactory.TracksErrors.DeviceInUse(HMSAction.TRACK, deviceInfo, err.message);
    case 'TypeError':
      return ErrorFactory.TracksErrors.NothingToReturn(HMSAction.TRACK, err.message);
    default:
      if (message.includes('device not found')) {
        return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, err.message);
      } else if (message.includes('permission denied')) {
        return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, err.message);
      } else {
        return ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, err.message);
      }
  }
}

export function BuildGetMediaError(err: Error, deviceInfo: string): HMSException {
  const exception = convertMediaErrorToHMSException(err, deviceInfo);
  exception.addNativeError(err);
  return exception;
}
