import React from 'react';
import { useMedia } from 'react-use';
import { DesktopOptions } from './SplitComponents/DesktopOptions';
import { MwebOptions } from './SplitComponents/MwebOptions';
import { config as cssConfig } from '../../../';

export const MoreSettings = () => {
  const isMobile = useMedia(cssConfig.media.md);
  return isMobile ? <MwebOptions /> : <DesktopOptions />;
};
