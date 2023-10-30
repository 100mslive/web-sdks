import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFullscreen, useMedia, usePrevious, useToggle } from 'react-use';
import { HLSPlaybackState, HMSHLSPlayer, HMSHLSPlayerEvents } from '@100mslive/hls-player';
import screenfull from 'screenfull';
import { selectAppData, selectHLSState, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { ColoredHandIcon, ExpandIcon, PlayIcon, RadioIcon, ShrinkIcon } from '@100mslive/react-icons';
import { HlsStatsOverlay } from '../components/HlsStatsOverlay';
import { HMSVideoPlayer } from '../components/HMSVideo';
import { FullScreenButton } from '../components/HMSVideo/FullscreenButton';
import { HLSAutoplayBlockedPrompt } from '../components/HMSVideo/HLSAutoplayBlockedPrompt';
import { HLSQualitySelector } from '../components/HMSVideo/HLSQualitySelector';
import { ToastManager } from '../components/Toast/ToastManager';
import { IconButton } from '../../IconButton';
import { Box, Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';
import { config, useTheme } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import { APP_DATA, EMOJI_REACTION_TYPE } from '../common/constants';

let hlsPlayer;

const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const hmsActions = useHMSActions();
  const { themeType, theme } = useTheme();
  const [streamEnded, setStreamEnded] = useState(false);
  let [hlsStatsState, setHlsStatsState] = useState(null);
  const hlsUrl = hlsState.variants[0]?.url;
  const [availableLayers, setAvailableLayers] = useState([]);
  const [isVideoLive, setIsVideoLive] = useState(true);
  const [isUserSelectedAuto, setIsUserSelectedAuto] = useState(true);
  const [currentSelectedQuality, setCurrentSelectedQuality] = useState(null);
  const [isHlsAutoplayBlocked, setIsHlsAutoplayBlocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isFullScreenSupported = screenfull.isEnabled;
  const [show, toggle] = useToggle(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsRef = useRef();
  const controlsTimerRef = useRef();
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
  const lastHlsUrl = usePrevious(hlsUrl);

  const isMobile = useMedia(config.media.md);
  const isFullScreen = useFullscreen(hlsViewRef, show, {
    onClose: () => toggle(false),
  });
  const [showLoader, setShowLoader] = useState(false);

  // FIXME: move this logic to player controller in next release
  useEffect(() => {
    /**
     * @type {HTMLVideoElement} videoEl
     */
    const videoEl = videoRef.current;
    const showLoader = () => setShowLoader(true);
    const hideLoader = () => setShowLoader(false);
    videoEl?.addEventListener('playing', hideLoader);
    videoEl?.addEventListener('waiting', showLoader);
    return () => {
      videoEl?.removeEventListener('playing', hideLoader);
      videoEl?.removeEventListener('waiting', showLoader);
    };
  }, []);
  useEffect(() => {
    if (streamEnded && lastHlsUrl !== hlsUrl) {
      setStreamEnded(false);
    }
  }, [hlsUrl, streamEnded, lastHlsUrl]);

  useEffect(() => {
    const videoElem = videoRef.current;
    const setStreamEndedCallback = () => {
      setStreamEnded(true);
      // no point keeping the callback attached once the streaming is ended
      videoElem?.removeEventListener('ended', setStreamEndedCallback);
    };
    videoElem?.addEventListener('ended', setStreamEndedCallback);
    return () => {
      videoElem?.removeEventListener('ended', setStreamEndedCallback);
    };
  }, [hlsUrl]);

  /**
   * initialize HMSHLSPlayer and add event listeners.
   */
  useEffect(() => {
    let videoEl = videoRef.current;
    const manifestLoadedHandler = ({ layers }) => {
      setAvailableLayers(layers);
    };
    const layerUpdatedHandler = ({ layer }) => {
      setCurrentSelectedQuality(layer);
    };
    const metadataLoadedHandler = ({ payload, ...rest }) => {
      const parsePayload = str => {
        try {
          return JSON.parse(str);
        } catch (e) {
          return str;
        }
      };
      // parse payload and extract start_time and payload
      const duration = rest.duration;
      const parsedPayload = parsePayload(payload);
      switch (parsedPayload.type) {
        case EMOJI_REACTION_TYPE:
          window.showFlyingEmoji?.({ emojiId: parsedPayload?.emojiId, senderId: parsedPayload?.senderId });
          break;
        default: {
          const toast = {
            title: `Payload from timed Metadata ${parsedPayload}`,
            duration: duration || 3000,
          };
          console.debug('Added toast ', JSON.stringify(toast));
          ToastManager.addToast(toast);
          break;
        }
      }
    };
    const handleError = data => {
      console.error('[HLSView] error in hls', `${data}`);
    };
    const handleNoLongerLive = ({ isLive }) => {
      setIsVideoLive(isLive);
    };

    const playbackEventHandler = data => setIsPaused(data.state === HLSPlaybackState.paused);

    const handleAutoplayBlock = data => setIsHlsAutoplayBlocked(!!data);
    if (videoEl && hlsUrl) {
      hlsPlayer = new HMSHLSPlayer(hlsUrl, videoEl);
      hlsPlayer.on(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
      hlsPlayer.on(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, metadataLoadedHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.ERROR, handleError);
      hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);

      hlsPlayer.on(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.LAYER_UPDATED, layerUpdatedHandler);
      return () => {
        hlsPlayer.off(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
        hlsPlayer.off(HMSHLSPlayerEvents.ERROR, handleError);
        hlsPlayer.off(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, metadataLoadedHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
        hlsPlayer.off(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.LAYER_UPDATED, layerUpdatedHandler);
        hlsPlayer.reset();
        hlsPlayer = null;
      };
    }
  }, [hlsUrl]);

  /**
   * initialize and subscribe to hlsState
   */
  useEffect(() => {
    const onHLSStats = state => setHlsStatsState(state);
    if (enablHlsStats) {
      hlsPlayer?.on(HMSHLSPlayerEvents.STATS, onHLSStats);
    } else {
      hlsPlayer?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    }
    return () => {
      hlsPlayer?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    };
  }, [enablHlsStats]);

  const unblockAutoPlay = async () => {
    try {
      await hlsPlayer.play();
      setIsHlsAutoplayBlocked(false);
    } catch (error) {
      console.error('Tried to unblock Autoplay failed with', error.message);
    }
  };

  const handleQuality = useCallback(
    quality => {
      if (hlsPlayer) {
        setIsUserSelectedAuto(quality.height.toString().toLowerCase() === 'auto');
        hlsPlayer.setLayer(quality);
      }
    },
    [availableLayers], //eslint-disable-line
  );

  const sfnOverlayClose = () => {
    hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats);
  };

  useEffect(() => {
    if (controlsVisible && isFullScreen && !qualityDropDownOpen) {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 5000);
    }
    if (!isFullScreen && controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [controlsVisible, isFullScreen, qualityDropDownOpen]);

  const onHoverHandler = useCallback(
    event => {
      if (event.type === 'mouseenter' || qualityDropDownOpen) {
        setControlsVisible(true);
        return;
      }
      if (event.type === 'mouseleave') {
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
    <Flex
      key="hls-viewer"
      id={`hls-viewer-${themeType}`}
      ref={hlsViewRef}
      css={{
        size: '100%',
      }}
    >
      {hlsStatsState?.url && enablHlsStats ? (
        <HlsStatsOverlay hlsStatsState={hlsStatsState} onClose={sfnOverlayClose} />
      ) : null}
      {hlsUrl && !streamEnded ? (
        <Flex
          id="hls-player-container"
          align="center"
          justify="center"
          css={{
            width: '100%',
            margin: '0 auto',
            height: '100%',
          }}
        >
          <HLSAutoplayBlockedPrompt open={isHlsAutoplayBlocked} unblockAutoPlay={unblockAutoPlay} />
          {showLoader && (
            <Flex
              align="center"
              justify="center"
              css={{
                position: 'absolute',
              }}
            >
              <Loading width={72} height={72} />
            </Flex>
          )}
          <HMSVideoPlayer.Root
            ref={videoRef}
            onMouseEnter={onHoverHandler}
            onMouseMove={onHoverHandler}
            onMouseLeave={onHoverHandler}
          >
            {isMobile && isPaused && (
              <Box
                css={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translateY(-40%) translateX(-50%)',
                  padding: '$8 14px $8 18px',
                  display: 'inline-flex',
                  r: '50%',
                  gap: '$1',
                  bg: '$primary_default',
                  zIndex: 21,
                }}
              >
                <IconButton onClick={async () => await hlsPlayer?.play()} data-testid="play_btn">
                  <PlayIcon width="60px" height="60px" />
                </IconButton>
              </Box>
            )}
            <Flex
              ref={controlsRef}
              direction="column"
              justify="flex-end"
              align="flex-start"
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
              {!isMobile && (
                <HMSVideoPlayer.Controls.Root
                  css={{
                    p: '$4 $8',
                  }}
                >
                  <HMSVideoPlayer.Controls.Left>
                    <HMSVideoPlayer.PlayButton
                      onClick={async () => {
                        isPaused ? await hlsPlayer?.play() : hlsPlayer?.pause();
                      }}
                      isPaused={isPaused}
                    />
                    <HMSVideoPlayer.Duration hlsPlayer={hlsPlayer} />
                    <HMSVideoPlayer.Volume hlsPlayer={hlsPlayer} />
                    <IconButton
                      variant="standard"
                      css={{ px: '$2' }}
                      onClick={async () => {
                        await hlsPlayer.seekToLivePosition();
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
              )}
            </Flex>
          </HMSVideoPlayer.Root>
        </Flex>
      ) : (
        <Flex align="center" justify="center" direction="column" css={{ size: '100%', px: '$10' }}>
          <Flex css={{ c: '$on_surface_high', r: '$round', bg: '$surface_default', p: '$2' }}>
            {streamEnded ? <ColoredHandIcon height={56} width={56} /> : <RadioIcon height={56} width={56} />}
          </Flex>
          <Text variant="h5" css={{ c: '$on_surface_high', mt: '$10', mb: 0, textAlign: 'center' }}>
            {streamEnded ? 'Stream has ended' : 'Stream yet to start'}
          </Text>
          <Text variant="md" css={{ textAlign: 'center', mt: '$4', c: '$on_surface_medium' }}>
            {streamEnded ? 'Have a nice day!' : 'Sit back and relax'}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default HLSView;
