import adapter from 'webrtc-adapter';
import { ErrorFactory, HMSAction } from './ErrorFactory';
import { HMSException } from './HMSException';

export enum HMSGetMediaActions {
  AUDIO = 'audio',
  VIDEO = 'video',
  AV = 'audio, video',
  SCREEN = 'screen',
}

function getDefaultError(error: string, deviceInfo: string) {
  const message = error.toLowerCase();
  if (message.includes('device not found')) {
    return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, error);
  } else if (message.includes('permission denied')) {
    return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, error);
  } else {
    return ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, error);
  }
}

/**
 * # Edge Cases:
 * - Screenshare error: The problem is when block at OS level, chrome throws NotAllowedError(HMS code - 3001) while firefox throws NotFoundError(HMS code - 3002),
 * we will handle this internally and throw error as User block - 3001 and OS block - 3002 for all browsers.
 * Chrome -
 * User blocked - NotAllowedError - Permission denied
 * System blocked - NotAllowedError - Permission denied by system
 */
// eslint-disable-next-line complexity
function convertMediaErrorToHMSException(err: Error, deviceInfo: string): HMSException {
  /**
   * Note: Adapter detects all chromium browsers as 'chrome'
   */
  const deniedBySystem =
    deviceInfo === 'screen' &&
    ((adapter.browserDetails.browser === 'chrome' &&
      err.name === 'NotAllowedError' &&
      err.message.includes('denied by system')) ||
      err.name === 'NotFoundError');
  if (deniedBySystem) {
    return ErrorFactory.TracksErrors.SystemDeniedPermission(HMSAction.TRACK, deviceInfo, err.message);
  }

  switch (err.name) {
    case 'OverconstrainedError':
      return ErrorFactory.TracksErrors.OverConstrained(
        HMSAction.TRACK,
        deviceInfo,
        (err as OverconstrainedError).constraint,
      );
    case 'NotAllowedError':
      return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, err.message);
    case 'NotFoundError':
      return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, err.message);
    case 'NotReadableError':
      return ErrorFactory.TracksErrors.DeviceInUse(HMSAction.TRACK, deviceInfo, err.message);
    case 'TypeError':
      return ErrorFactory.TracksErrors.NothingToReturn(HMSAction.TRACK, err.message);
    default:
      return getDefaultError(err.message, deviceInfo);
  }
}

export function BuildGetMediaError(err: Error, deviceInfo: string): HMSException {
  const exception = convertMediaErrorToHMSException(err, deviceInfo);
  exception.addNativeError(err);
  return exception;
}
