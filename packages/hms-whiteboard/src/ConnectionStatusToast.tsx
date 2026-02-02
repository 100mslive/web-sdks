import { useEffect, useRef } from 'react';
import { TLStoreWithStatus, useToasts } from '@tldraw/tldraw';

interface ConnectionStatusToastProps {
  store: TLStoreWithStatus;
}

export function ConnectionStatusToast({ store }: ConnectionStatusToastProps) {
  const { addToast, removeToast } = useToasts();
  const prevConnectionStatus = useRef<'online' | 'offline' | undefined>(undefined);
  const offlineToastId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const connectionStatus = store.status === 'synced-remote' ? store.connectionStatus : undefined;

    // Skip if status hasn't changed
    if (connectionStatus === prevConnectionStatus.current) {
      return;
    }

    // Remove existing offline toast when coming back online
    if (offlineToastId.current && connectionStatus === 'online') {
      removeToast(offlineToastId.current);
      offlineToastId.current = undefined;
    }

    if (connectionStatus === 'offline') {
      offlineToastId.current = addToast({
        title: 'Connection lost',
        description: 'Attempting to reconnect...',
        icon: 'warning-triangle',
        keepOpen: true,
      });
    } else if (connectionStatus === 'online' && prevConnectionStatus.current === 'offline') {
      addToast({
        title: 'Connected',
        description: 'Connection restored',
        icon: 'check',
      });
    }

    prevConnectionStatus.current = connectionStatus;
  }, [store, addToast, removeToast]);

  return null;
}
