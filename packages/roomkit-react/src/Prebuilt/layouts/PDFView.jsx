import React, { useEffect } from 'react';
import { usePDFShare } from '@100mslive/react-sdk';
import { LayoutMode } from '../components/Settings/LayoutSettings';
import { ToastManager } from '../components/Toast/ToastManager';
import { Box } from '../../Layout';
import { EmbedScreenShareView } from './EmbedView';
import { usePDFConfig, useResetPDFConfig, useSetUiSettings } from '../components/AppData/useUISettings';
import { UI_SETTINGS } from '../common/constants';

/**
 * PDFView is responsible for rendering the PDF iframe and managing the screen sharing functionality.
 */
export const PDFView = () => {
  const pdfConfig = usePDFConfig();
  const resetConfig = useResetPDFConfig();
  // need to send resetConfig to clear configuration, if stop screenshare occurs.
  const { iframeRef, startPDFShare, isPDFShareInProgress } = usePDFShare(resetConfig);
  const [layoutMode, setLayoutMode] = useSetUiSettings(UI_SETTINGS.layoutMode);

  useEffect(() => {
    // PDF view should render in gallery mode. Peer layouts (Screenshare/Whiteboard) force
    // SIDEBAR but PDFView never mounts inside GridLayout, so nothing else reconciles it.
    if (layoutMode === LayoutMode.GALLERY) {
      return;
    }
    setLayoutMode(LayoutMode.GALLERY);
    return () => {
      // restore previous layout mode once PDF view closes
      setLayoutMode(layoutMode);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // no working in other useEffect, as return is called multiple time on state change
    return () => {
      resetConfig();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    (async () => {
      try {
        if (!isPDFShareInProgress && pdfConfig) {
          await startPDFShare(pdfConfig);
        }
      } catch (err) {
        resetConfig();
        ToastManager.addToast({
          title: `Error while sharing annotator ${err.message || ''}`,
          variant: 'error',
        });
      }
    })();
  }, [isPDFShareInProgress, pdfConfig, resetConfig, startPDFShare]);
  return (
    <EmbedScreenShareView>
      <Box
        css={{
          mx: '$8',
          flex: '3 1 0',
          '@lg': {
            flex: '2 1 0',
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <iframe
          title="Embed View"
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            borderRadius: '0.75rem',
          }}
          allow="autoplay; clipboard-write;"
          referrerPolicy="no-referrer"
        />
      </Box>
    </EmbedScreenShareView>
  );
};
