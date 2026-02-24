import React, { useEffect, useRef } from 'react';
import {
  selectIsTranscriptionEnabled,
  useHMSStore,
  useHMSVanillaNotifications,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { Box } from '../../Layout';
// @ts-ignore: No implicit Any
import { CaptionsViewerJS } from './CaptionsViewerJS';
// @ts-ignore: No implicit Any
import { useIsCaptionEnabled } from '../components/AppData/useUISettings';

export const CaptionsViewerJSWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CaptionsViewerJS | null>(null);

  const notifications = useHMSVanillaNotifications();
  const store = useHMSVanillaStore();
  const isCaptionEnabled = useIsCaptionEnabled();
  const isTranscriptionEnabled = useHMSStore(selectIsTranscriptionEnabled);

  const shouldShow = isCaptionEnabled && isTranscriptionEnabled;

  useEffect(() => {
    if (!containerRef.current || !notifications || !store) return;

    const viewer = new CaptionsViewerJS({
      notifications,
      store,
      containerEl: containerRef.current,
    });
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [notifications, store]);

  useEffect(() => {
    if (!viewerRef.current) return;
    if (shouldShow) {
      viewerRef.current.show();
    } else {
      viewerRef.current.hide();
    }
  }, [shouldShow]);

  return (
    <Box
      ref={containerRef}
      css={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    />
  );
};
