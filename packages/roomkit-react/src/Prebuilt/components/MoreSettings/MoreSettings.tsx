import React from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
// @ts-ignore: No implicit Any
import { DesktopOptions } from './SplitComponents/DesktopOptions';
// @ts-ignore: No implicit Any
import { MwebOptions } from './SplitComponents/MwebOptions';
import { config as cssConfig } from '../../..';
import { useContainerQuery } from '../hooks/useContainerQuery';
import { useLandscapeHLSStream } from '../../common/hooks';

export const MoreSettings = ({
  elements,
  screenType,
}: {
  elements: DefaultConferencingScreen_Elements | HLSLiveStreamingScreen_Elements;
  screenType: keyof ConferencingScreen;
}) => {
  const isMobile = useContainerQuery(cssConfig.media.md);
  const isLandscapeHLSStream = useLandscapeHLSStream();
  return isMobile || isLandscapeHLSStream ? (
    <MwebOptions elements={elements} screenType={screenType} />
  ) : (
    <DesktopOptions elements={elements} screenType={screenType} />
  );
};
