import React from 'react';
import { selectLocalPeerRoleName, useHMSStore } from '@100mslive/react-sdk';
import { ConferencingFooter } from './Footer/ConferencingFooter';
import { StreamingFooter } from './Footer/StreamingFooter';
import { useHLSViewerRole } from './AppData/useUISettings';
import { useShowStreamingUI } from '../common/hooks';

export const Footer = () => {
  const showStreamingUI = useShowStreamingUI();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const hlsViewerRole = useHLSViewerRole();
  const isHlsViewer = hlsViewerRole === localPeerRole;
  return showStreamingUI || isHlsViewer ? <StreamingFooter /> : <ConferencingFooter />;
};
