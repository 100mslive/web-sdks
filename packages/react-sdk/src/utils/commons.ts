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

export const validPDFUrl = (pdfURL: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!pdfURL) {
      reject('Pdf url is invalid');
    }
    const extension: string | undefined = pdfURL.split('.').pop();
    if (!extension || extension.toLowerCase() === 'pdf') {
      resolve(true);
    }
    fetch(pdfURL, { method: 'HEAD' })
      .then(response => response.headers.get('content-type'))
      .then(contentType => {
        if (contentType === 'application/pdf') {
          resolve(true);
        } else {
          reject('Pdf url is invalid');
        }
      })
      .catch(error => {
        reject(error);
      });
  });
};
