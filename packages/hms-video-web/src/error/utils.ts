import { ErrorFactory, HMSAction } from './ErrorFactory';
import { HMSException } from './HMSException';

export enum HMSGetMediaActions {
  AUDIO = 'audio',
  VIDEO = 'video',
  AV = 'audio, video',
  SCREEN = 'screen',
}

export function BuildGetMediaError(err: Error, deviceInfo: string): HMSException {
  const message = err.message.toLowerCase();

  switch (err.name) {
    case 'OverconstrainedError':
      return ErrorFactory.GenericErrors.Unknown(HMSAction.TRACK, err.message);
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
        return ErrorFactory.GenericErrors.Unknown(HMSAction.TRACK, err.message);
      }
  }
}
