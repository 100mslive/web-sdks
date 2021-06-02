import HMSLogger from '../utils/logger';
import { ErrorFactory, HMSAction } from './ErrorFactory';
import HMSException from './HMSException';

const TAG = 'HMSErrorFactory';

export function BuildGetMediaError(err: Error, deviceInfo: string): HMSException {
  HMSLogger.e(TAG, `getLocalScreen`, err);
  const message = err.message.toLowerCase();

  switch (err.name) {
    case 'OverconstrainedError':
      return ErrorFactory.GenericErrors.Unknown(HMSAction.TRACK, err.message);
    case 'NotAllowedError':
      return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, err.message);
    case 'NotFoundError':
      return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, err.message);
    case 'NotReadableError':
      return ErrorFactory.TracksErrors.DeviceInUse(HMSAction.TRACK, err.message);
    case 'TypeError':
      return ErrorFactory.TracksErrors.NothingToReturn(HMSAction.TRACK, err.message);
    default:
      if (message.includes('device not found')) {
        return ErrorFactory.TracksErrors.DeviceNotAvailable(HMSAction.TRACK, err.message);
      } else if (message.includes('permission denied')) {
        return ErrorFactory.TracksErrors.CantAccessCaptureDevice(HMSAction.TRACK, deviceInfo, err.message);
      } else {
        return ErrorFactory.GenericErrors.Unknown(HMSAction.TRACK, err.message);
      }
  }
}

export enum HMSConnectionMethod {
  CreateOffer,
  CreateAnswer,
  SetLocalDescription,
  SetRemoteDescription,
}

export class HMSConnectionMethodException extends Error {
  method: HMSConnectionMethod;

  constructor(method: HMSConnectionMethod, message: string) {
    super(message);
    this.method = method;
  }

  toHMSException(action: HMSAction): HMSException {
    switch (this.method) {
      case HMSConnectionMethod.CreateOffer:
        return ErrorFactory.WebrtcErrors.CreateOfferFailed(action, this.message);
      case HMSConnectionMethod.CreateAnswer:
        return ErrorFactory.WebrtcErrors.CreateAnswerFailed(action, this.message);
      case HMSConnectionMethod.SetLocalDescription:
        return ErrorFactory.WebrtcErrors.SetLocalDescriptionFailed(action, this.message);
      case HMSConnectionMethod.SetRemoteDescription:
        return ErrorFactory.WebrtcErrors.SetRemoteDescriptionFailed(action, this.message);
    }
  }
}
