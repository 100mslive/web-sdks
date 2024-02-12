import React, { useCallback, useRef, useState } from 'react';
import { HMSHLSLayer } from '@100mslive/hls-player';
import screenfull from 'screenfull';
import { ExpandIcon, ShrinkIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { theme } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import { FullScreenButton } from './FullscreenButton';
import { HLSCaptionSelector } from './HLSCaptionSelector';
// @ts-ignore
import { HLSQualitySelector } from './HLSQualitySelector';
// @ts-ignore
import { HMSVideoPlayer } from './index';
import { useHMSPlayerContext } from './PlayerContext';

export const DesktopHLSView = React.forwardRef<
  HTMLDivElement,
  {
    isFullScreen: boolean;
    isPaused: boolean;
    hasCaptions: boolean;
    isCaptionEnabled: boolean;
    isVideoLive: boolean;
    availableLayers: HMSHLSLayer[];
    currentSelectedQuality: HMSHLSLayer;
    setIsVideoLive: (value: boolean) => void;
    toggle: () => void;
  }
>(
  (
    {
      isFullScreen,
      isPaused,
      hasCaptions,
      isCaptionEnabled,
      isVideoLive,
      availableLayers,
      currentSelectedQuality,
      setIsVideoLive,
      toggle,
    },
    videoRef,
  ) => {
    const hlsPlayerContext = useHMSPlayerContext();
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isUserSelectedAuto, setIsUserSelectedAuto] = useState(true);
    const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
    const controlsRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const controlsTimerRef = useRef();

    const isFullScreenSupported = screenfull.isEnabled;

    const handleQuality = useCallback(
      (quality: HMSHLSLayer) => {
        if (hlsPlayerContext) {
          setIsUserSelectedAuto(quality.height?.toString().toLowerCase() === 'auto');
          hlsPlayerContext?.setLayer(quality);
        }
      },
      [availableLayers], //eslint-disable-line
    );
    const onHoverHandler = useCallback(
      (event: any) => {
        if (event.type === 'mouseenter' || event.type === 'touchenter' || qualityDropDownOpen) {
          setControlsVisible(true);
          return;
        }
        if (event.type === 'mouseleave' || event.type === 'touchleave') {
          setControlsVisible(false);
        } else if (isFullScreen && !controlsVisible && event.type === 'mousemove') {
          setControlsVisible(true);
          if (controlsTimerRef.current) {
            clearTimeout(controlsTimerRef.current);
          }
        }
      },
      [controlsVisible, isFullScreen, qualityDropDownOpen],
    );
    return (
      <HMSVideoPlayer.Root
        ref={videoRef}
        onMouseEnter={onHoverHandler}
        onMouseMove={onHoverHandler}
        onMouseLeave={onHoverHandler}
      >
        <Flex
          ref={controlsRef}
          direction="column"
          justify="end"
          align="start"
          css={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            background: `linear-gradient(180deg, ${theme.colors.background_dim.value}00 29.46%, ${theme.colors.background_dim.value}A3 100%);`,
            width: '100%',
            pt: '$8',
            flexShrink: 0,
            transition: 'visibility 0s 0.5s, opacity 0.5s linear',
            visibility: controlsVisible ? `` : `hidden`,
            opacity: controlsVisible ? `1` : '0',
          }}
        >
          <HMSVideoPlayer.Progress />
          <HMSVideoPlayer.Controls.Root
            css={{
              p: '$4 $8',
            }}
          >
            <HMSVideoPlayer.Controls.Left>
              <HMSVideoPlayer.PlayButton
                onClick={async () => {
                  isPaused ? await hlsPlayerContext?.play() : hlsPlayerContext?.pause();
                }}
                isPaused={isPaused}
              />
              <HMSVideoPlayer.Duration />
              <HMSVideoPlayer.Volume />
              <IconButton
                css={{ px: '$2' }}
                onClick={async () => {
                  await hlsPlayerContext?.seekToLivePosition();
                  setIsVideoLive(true);
                }}
                key="jump-to-live_btn"
                data-testid="jump-to-live_btn"
              >
                <Tooltip title="Go to Live" side="top">
                  <Flex justify="center" gap={2} align="center">
                    <Box
                      css={{
                        height: '$4',
                        width: '$4',
                        background: isVideoLive ? '$alert_error_default' : '$on_primary_medium',
                        r: '$1',
                      }}
                    />
                    <Text
                      variant={{
                        '@sm': 'xs',
                      }}
                      css={{
                        c: isVideoLive ? '$on_surface_high' : '$on_surface_medium',
                      }}
                    >
                      {isVideoLive ? 'LIVE' : 'GO LIVE'}
                    </Text>
                  </Flex>
                </Tooltip>
              </IconButton>
            </HMSVideoPlayer.Controls.Left>

            <HMSVideoPlayer.Controls.Right>
              {hasCaptions && <HLSCaptionSelector isEnabled={isCaptionEnabled} />}
              {availableLayers.length > 0 ? (
                <HLSQualitySelector
                  layers={availableLayers}
                  onOpen={setQualityDropDownOpen}
                  open={qualityDropDownOpen}
                  selection={currentSelectedQuality}
                  onQualityChange={handleQuality}
                  isAuto={isUserSelectedAuto}
                />
              ) : null}
              {isFullScreenSupported ? (
                <FullScreenButton
                  isFullScreen={isFullScreen}
                  onToggle={toggle}
                  icon={isFullScreen ? <ShrinkIcon /> : <ExpandIcon />}
                />
              ) : null}
            </HMSVideoPlayer.Controls.Right>
          </HMSVideoPlayer.Controls.Root>
        </Flex>
      </HMSVideoPlayer.Root>
    );
  },
);
