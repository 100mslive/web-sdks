import { hooksErrHandler } from '../primitives/types';
import HMSLogger from './logger';

const TAG = 'react-sdk';

export const logErrorHandler: hooksErrHandler = (err: Error, method) => HMSLogger.e(TAG, method, err);

/**
 * pass in this error handler to get the error thrown back to the UI for further handling, showing toast etc.
 * @param err
 */
export const throwErrorHandler: hooksErrHandler = (err: Error) => {
  throw err;
};
