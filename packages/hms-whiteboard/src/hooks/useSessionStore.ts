import { useMemo } from 'react';
import { TLRecord } from '@tldraw/tldraw';
import { SessionStore } from './StoreClient';
import decodeJWT from '../utils';

export const useSessionStore = ({
  token,
  endpoint = 'https://store-prod-in3-grpc.100ms.live',
  handleError,
}: {
  token?: string;
  endpoint?: string;
  handleError: (error: Error) => void;
}) => {
  const sessionStore = useMemo(() => {
    try {
      decodeJWT(token);
    } catch (err) {
      return handleError(err as Error);
    }
    if (!endpoint || !token) {
      return handleError(new Error('Missing GRPC endpoint or token'));
    }

    const sessionStore = new SessionStore<TLRecord>(endpoint, token);
    // @ts-expect-error - for debugging
    window.sessionStore = sessionStore;
    return sessionStore;
  }, [endpoint, token, handleError]);

  return sessionStore;
};
