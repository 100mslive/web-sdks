import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HMSHLSLayer } from '@100mslive/hls-player';
import screenfull from 'screenfull';
import { selectHLSState, selectPeerCount, useHMSStore } from '@100mslive/react-sdk';
import { ExpandIcon, PauseIcon, PlayIcon, ShrinkIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { Tooltip } from '../../../Tooltip';
// @ts-ignore: No implicit any
import { Logo } from '../Header/HeaderComponents';
import { LeaveRoom } from '../Leave/LeaveRoom';
import { FullScreenButton } from './FullscreenButton';
import { HLSCaptionSelector } from './HLSCaptionSelector';
// @ts-ignore
import { HLSQualitySelector } from './HLSQualitySelector';
import { getTime, getWatchCount } from './HMSVIdeoUtils';
// @ts-ignore
import { HMSVideoPlayer } from './index';
import { useHMSPlayerContext } from './PlayerContext';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const MwebHLSView = React.forwardRef<
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

    const { screenType } = useRoomLayoutConferencingScreen();

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
      (event: React.MouseEvent<HTMLElement>) => {
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
      <>
        <HMSVideoPlayer.Root
          ref={videoRef}
          onMouseEnter={onHoverHandler}
          onMouseMove={onHoverHandler}
          onMouseLeave={onHoverHandler}
          onTouchStart={onHoverHandler}
          onTouchLeave={onHoverHandler}
        >
          <Box
            css={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translateY(-40%) translateX(-50%)',
              padding: '$4 14px $4 14px',
              display: 'inline-flex',
              r: '$round',
              gap: '$1',
              bg: 'rgba(0, 0, 0, 0.6)',
              zIndex: 21,
              visibility: controlsVisible ? `` : `hidden`,
              opacity: controlsVisible ? `1` : '0',
            }}
          >
            {isPaused ? (
              <IconButton onClick={async () => await hlsPlayerContext?.play()} data-testid="play_btn">
                <PlayIcon width="48px" height="48px" />
              </IconButton>
            ) : (
              <IconButton onClick={async () => hlsPlayerContext?.pause()} data-testid="pause_btn">
                <PauseIcon width="48px" height="48px" />
              </IconButton>
            )}
          </Box>
          <Flex
            ref={controlsRef}
            direction="column"
            justify="start"
            align="start"
            css={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              flexShrink: 0,
              visibility: controlsVisible ? `` : `hidden`,
              opacity: controlsVisible ? `1` : '0',
            }}
          >
            <HMSVideoPlayer.Controls.Root
              css={{
                p: '$4 $8',
              }}
            >
              <HMSVideoPlayer.Controls.Left>
                <LeaveRoom screenType={screenType} />
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
              </HMSVideoPlayer.Controls.Right>
            </HMSVideoPlayer.Controls.Root>
          </Flex>
          <Flex
            ref={controlsRef}
            direction="column"
            justify="end"
            align="start"
            css={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              pt: '$8',
              flexShrink: 0,
              transition: 'visibility 0s 0.5s, opacity 0.5s linear',
              visibility: controlsVisible ? `` : `hidden`,
              opacity: controlsVisible ? `1` : '0',
            }}
          >
            <HMSVideoPlayer.Controls.Root
              css={{
                p: '$4 $8',
              }}
            >
              <HMSVideoPlayer.Controls.Left>
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
                <HMSVideoPlayer.Duration />
              </HMSVideoPlayer.Controls.Left>

              <HMSVideoPlayer.Controls.Right>
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
        <Flex
          direction="column"
          justify="end"
          align="start"
          css={{
            position: 'absolute',
            bottom: '0',
            w: '100%',
          }}
        >
          <HMSVideoPlayer.Progress />
          <HLSViewTitle />
        </Flex>
      </>
    );
  },
);
/*
	player handler --> left -> go live with timer or live, right -> expand icon 
	inbetween -> play pause icon, double tap to go back/forward
	seekbar
	half page will have chat or participant view
*/
const HLSViewTitle = () => {
  const peerCount = useHMSStore(selectPeerCount);
  const hlsState = useHMSStore(selectHLSState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { screenType } = useRoomLayoutConferencingScreen();
  const [liveTime, setLiveTime] = useState(0);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const timeStamp = hlsState?.variants[0]?.[screenType === 'hls_live_streaming' ? 'startedAt' : 'initialisedAt'];
      if (hlsState?.running && timeStamp) {
        setLiveTime(Date.now() - timeStamp.getTime());
      }
    }, 60000);
  }, [hlsState?.running, hlsState?.variants]);

  useEffect(() => {
    if (hlsState?.running) {
      startTimer();
    }
    if (!hlsState?.running && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hlsState.running, startTimer]);

  return (
    <Flex gap="2" align="center" css={{ position: 'relative', height: '100%' }}>
      <Logo />
      <Flex direction="column">
        <Text variant="sub2">Tech Talk</Text>
        <Flex>
          <Text variant="caption">{getWatchCount(peerCount)}</Text>
          <Text
            variant="caption"
            css={{
              w: '$3',
              h: '$8',
            }}
          >
            .
          </Text>
          <Text variant="caption">{getTime(liveTime)}</Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
