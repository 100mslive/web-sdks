import { ReactNode, useCallback, useMemo, useState } from 'react';
import { PIPContext } from './context';

type PIPProviderProps = {
  children: ReactNode;
};

export const PIPProvider = ({ children }: PIPProviderProps) => {
  // Detect if the feature is available.
  const isSupported = 'documentPictureInPicture' in window;

  // Expose pipWindow that is currently active
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Close pipWidnow programmatically
  const closePipWindow = useCallback(() => {
    if (pipWindow != null) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [pipWindow]);

  // Open new pipWindow
  const requestPipWindow = useCallback(
    async (width: number, height: number) => {
      // We don't want to allow multiple requests.
      if (pipWindow != null) {
        return;
      }
      // @ts-ignore for documentPIP
      const pip = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      });

      // Detect when window is closed by user
      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    },
    [pipWindow],
  );

  const value = useMemo(() => {
    return {
      isSupported,
      pipWindow,
      requestPipWindow,
      closePipWindow,
    };
  }, [closePipWindow, isSupported, pipWindow, requestPipWindow]);

  return <PIPContext.Provider value={value}>{children}</PIPContext.Provider>;
};
