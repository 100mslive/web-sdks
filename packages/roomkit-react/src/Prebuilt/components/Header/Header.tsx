import React from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { ConferencingHeader } from './ConferencingHeader';
import { StreamingHeader } from './StreamingHeader';

export const Header = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
  return screenType === 'hls_live_streaming' ? <StreamingHeader /> : <ConferencingHeader />;
};
