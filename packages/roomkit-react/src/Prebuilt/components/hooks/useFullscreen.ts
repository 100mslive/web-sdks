import { useCallback, useEffect, useState } from 'react';
import screenfull from 'screenfull';
// @ts-ignore: No implicit any
import { ToastManager } from '../Toast/ToastManager';
import { DEFAULT_PORTAL_CONTAINER } from '../../common/constants';

export const useFullscreen = () => {
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(screenfull.isFullscreen);

  const toggle = useCallback(async () => {
    if (!screenfull.isEnabled) {
      ToastManager.addToast({ title: 'Fullscreen feature not supported' });
      return;
    }
    try {
      const container = document.querySelector(DEFAULT_PORTAL_CONTAINER);
      if (isFullScreenEnabled) {
        await screenfull.exit();
      } else if (container) {
        await screenfull.request(container);
      }
    } catch (err) {
      ToastManager.addToast({ title: (err as Error).message });
    }
  }, [isFullScreenEnabled]);

  useEffect(() => {
    const onChange = () => {
      setIsFullScreenEnabled(screenfull.isFullscreen);
    };
    if (screenfull.isEnabled) {
      screenfull.on('change', onChange);
    }
    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', onChange);
      }
    };
  }, []);

  return {
    allowed: screenfull.isEnabled,
    isFullscreen: isFullScreenEnabled,
    toggleFullscreen: toggle,
  };
};
