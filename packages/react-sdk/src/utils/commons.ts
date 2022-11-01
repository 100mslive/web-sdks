import HMSLogger from './logger';
import { hooksErrHandler } from '../hooks/types';

const TAG = 'react-sdk';

export const logErrorHandler: hooksErrHandler = (err: Error, method?: string) => HMSLogger.e(TAG, method, err);

/**
 * pass in this error handler to get the error thrown back to the UI for further handling, showing toast etc.
 * @param err
 */
export const throwErrorHandler: hooksErrHandler = (err: Error) => {
  throw err;
};
