import React from 'react';
import { ConferencingFooter } from './Footer/ConferencingFooter';
import { StreamingFooter } from './Footer/StreamingFooter';
import { useShowStreamingUI } from '../common/hooks';

export const Footer = () => {
  const showStreamingUI = useShowStreamingUI();
  return showStreamingUI ? <StreamingFooter /> : <ConferencingFooter />;
};
