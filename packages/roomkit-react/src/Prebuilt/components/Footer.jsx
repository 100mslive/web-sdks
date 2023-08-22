import React from 'react';
import { ConferencingFooter } from './Footer/ConferencingFooter';
import { StreamingFooter } from './Footer/StreamingFooter';
import { useIsLocalPeerHLSViewer, useShowStreamingUI } from '../common/hooks';

export const Footer = () => {
  const showStreamingUI = useShowStreamingUI();
  const isHlsViewer = useIsLocalPeerHLSViewer();
  return showStreamingUI || isHlsViewer ? <StreamingFooter /> : <ConferencingFooter />;
};
