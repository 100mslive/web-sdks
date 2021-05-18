import HMSLogger from '../utils/logger';
import { HMSAction } from './HMSAction';
import HMSErrors from './HMSErrors';
import HMSException, { HMSExceptionBuilder } from './HMSException';

const TAG = 'HMSErrorFactory';

export function BuildGetMediaError(err: Error, action: HMSAction): HMSException {
  HMSLogger.e(TAG, `getLocalScreen`, err);
  const message = err.message.toLowerCase();

  if (err instanceof OverconstrainedError) {
    // TODO: Add a appropriate `CodeMessage` for OverContrainedError
    return new HMSExceptionBuilder(HMSErrors.Unknown).action(action).errorInfo(err.message).build();
  } else {
    if (message.includes('device not found')) {
      return new HMSExceptionBuilder(HMSErrors.DeviceNotAvailable).action(action).errorInfo(err.message).build();
    } else if (message.includes('permission denied')) {
      return new HMSExceptionBuilder(HMSErrors.CantAccessCaptureDevice).action(action).errorInfo(err.message).build();
    } else {
      return new HMSExceptionBuilder(HMSErrors.Unknown).action(action).errorInfo(err.message).build();
    }
  }
}
