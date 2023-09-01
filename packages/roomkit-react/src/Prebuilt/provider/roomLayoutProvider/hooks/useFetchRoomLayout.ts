import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetResponse, Layout } from '@100mslive/types-prebuilt';
import merge from 'lodash.merge';
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
  updateRoomLayoutForRole: (role: string) => void;
};

export const useFetchRoomLayout = ({
  endpoint = 'https://api.100ms.live/v2/layouts/ui',
  authToken = '',
}: useFetchRoomLayoutProps): useFetchRoomLayoutResponse => {
  const [layout, setLayout] = useState<Layout | undefined>(undefined);
  const layoutResp = useRef<GetResponse>();
  const isFetchInProgress = useRef(false);
  const updateRoomLayoutForRole = useCallback((role: string) => {
    if (!layoutResp.current) {
      return;
    }
    const [layout] = (layoutResp.current?.data || []).filter(layout => layout.role === role);
    if (layout) {
      setLayout(layout);
    }
  }, []);
  useEffect(() => {
    (async () => {
      if (isFetchInProgress.current || !authToken) {
        return;
      }
      isFetchInProgress.current = true;
      const resp = await fetchWithRetry(endpoint, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      layoutResp.current = await resp.json();
      const layout = merge(defaultLayout, layoutResp.current?.data?.[0]);
      setLayout(layout);
      isFetchInProgress.current = false;
    })();
  }, [authToken, endpoint]);

  return { layout, updateRoomLayoutForRole };
};
