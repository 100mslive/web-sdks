import React from 'react';
import { ConferencingFooter } from './Footer/ConferencingFooter';
import { StreamingFooter } from './Footer/StreamingFooter';
import { useRoomLayout } from '../provider/roomLayoutProvider';
import { showStreamingUI } from '../common/utils';

export const Footer = () => {
  const layout = useRoomLayout();
  return showStreamingUI(layout) ? <StreamingFooter /> : <ConferencingFooter />;
};
