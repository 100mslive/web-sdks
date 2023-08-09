import React from 'react';
import { ConferencingFooter } from './Footer/ConferencingFooter';
import { StreamingFooter } from './Footer/StreamingFooter';
import { showStreamingUI } from '../common/utils';
import { useRoomLayout } from '../provider/roomLayoutProvider';

export const Footer = () => {
  const layout = useRoomLayout();
  return showStreamingUI(layout) ? <StreamingFooter /> : <ConferencingFooter />;
};
