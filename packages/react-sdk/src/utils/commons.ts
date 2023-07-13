import { useEffect, useRef } from 'react';
import { parsedUserAgent } from '@100mslive/hms-video-store';
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

export const isValidPDFUrl = (pdfURL: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!pdfURL) {
      reject(new Error('URL is empty'));
    }
    fetch(pdfURL, { method: 'HEAD' })
      .then(response => response.headers.get('content-type'))
      .then(contentType => {
        if (contentType === 'application/pdf') {
          resolve(true);
        } else {
          reject(new Error('URL does not contain pdf'));
        }
      })
      .catch(error => {
        reject(error as Error);
      });
  });
};

export default function usePrevious<T>(state: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = state;
  });

  return ref.current;
}

const chromiumBasedBrowsers = ['chrome', 'brave', 'opera', 'edge'];

export const isChromiumBased = chromiumBasedBrowsers.some(
  (value: string) => parsedUserAgent.getBrowser()?.name?.toLowerCase() === value,
);

export const pdfIframeURL = 'https://pdf-annotation.100ms.live/generic/web/viewer.html';
