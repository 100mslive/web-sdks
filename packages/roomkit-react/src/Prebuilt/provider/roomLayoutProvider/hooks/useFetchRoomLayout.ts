import { useEffect, useRef, useState } from 'react';
import type { GetResponse, Layout } from '@100mslive/types-prebuilt';
import { defaultLayout } from '../constants';

// TODO: remove this usage
const fetchWithRetry = async (url = '', options = {}) => {
  const MAX_RETRIES = 4;
  let error = Error('something went wrong');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      error = err as Error;
    }
  }
  console.error('Fetch failed after max retries', { url, options });
  throw error;
};

// this should take endpoint and return
export type useFetchRoomLayoutProps = {
  endpoint?: string;
  authToken: string;
};

export type useFetchRoomLayoutResponse = {
  layout: Layout | undefined;
};

export const useFetchRoomLayout = ({
  endpoint = '',
  authToken = '',
}: useFetchRoomLayoutProps): useFetchRoomLayoutResponse => {
  const [layout, setLayout] = useState<Layout | undefined>(undefined);
  const isFetchInProgress = useRef(false);
  useEffect(() => {
    (async () => {
      if (isFetchInProgress.current || !authToken) {
        return;
      }
      if (!endpoint) {
        setLayout(defaultLayout);
      }
      isFetchInProgress.current = true;
      const resp = await fetchWithRetry(endpoint, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const layoutResp: GetResponse = await resp.json();
      setLayout(layoutResp.data[0]);
      isFetchInProgress.current = false;
    })();
  }, [authToken, endpoint]);

  return { layout };
};
