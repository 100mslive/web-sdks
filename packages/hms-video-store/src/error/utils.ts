import adapter from 'webrtc-adapter';
import { ErrorFactory } from './ErrorFactory';
import { HMSAction } from './HMSAction';
import { HMSTrackException } from './HMSTrackException';

export enum HMSGetMediaActions {
  UNKNOWN = 'unknown(video or audio)',
  AUDIO = 'audio',
  VIDEO = 'video',
  AV = 'audio, video',
  SCREEN = 'screen',
}

function getDefaultError(error: string, deviceInfo: string) {
  const message = error.toLowerCase();
  let exception = ErrorFactory.TracksErrors.GenericTrack(HMSAction.TRACK, error);

  if (message.includes('device not found')) {
    exception = ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, deviceInfo, error);
  } else if (message.includes('permission denied')) {
    exception = ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, error);
  }

  return exception;
}

/**
 * # Edge Cases:
 * - Screenshare error: The problem is when block at OS level, chrome throws NotAllowedError(HMS code - 3001) while firefox throws NotFoundError(HMS code - 3002),
 * we will handle this internally and throw error as User block - 3001 and OS block - 3011 for all browsers.
 * Chrome -
 * User blocked - NotAllowedError - Permission denied
 * System blocked - NotAllowedError - Permission denied by system
 */
// eslint-disable-next-line complexity
function convertMediaErrorToHMSException(err: Error, deviceInfo = ''): HMSTrackException {
  /**
   * Note: Adapter detects all chromium browsers as 'chrome'
   */
  const chromeSystemDenied =
    adapter.browserDetails.browser === 'chrome' &&
    err.name === 'NotAllowedError' &&
    err.message.includes('denied by system');

  if (chromeSystemDenied) {
    return ErrorFactory.TracksErrors.SystemDeniedPermission(HMSAction.TRACK, deviceInfo, err.message);
  }

  if (adapter.browserDetails.browser === 'firefox' && err.name === 'NotFoundError') {
    const hmsError = ErrorFactory.TracksErrors.SystemDeniedPermission(HMSAction.TRACK, deviceInfo, err.message);
    hmsError.description = `Capture device is either blocked at Operating System level or not available - ${deviceInfo}`;
    return hmsError;
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

export function BuildGetMediaError(err: Error, deviceInfo: string): HMSTrackException {
  const exception = convertMediaErrorToHMSException(err, deviceInfo);
  exception.addNativeError(err);
  return exception;
}
