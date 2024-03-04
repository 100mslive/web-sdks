import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFullscreen, useMedia, usePrevious, useToggle } from 'react-use';
import { HLSPlaybackState, HMSHLSPlayer, HMSHLSPlayerEvents } from '@100mslive/hls-player';
import screenfull from 'screenfull';
import {
  HLSPlaylistType,
  HMSNotificationTypes,
  selectAppData,
  selectHLSState,
  selectPeerNameByID,
  selectPollByID,
  useHMSActions,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { BackwardArrowIcon, ColoredHandIcon, ForwardArrowIcon, GoLiveIcon } from '@100mslive/react-icons';
import { ChatToggle } from '../components/Footer/ChatToggle';
import { HlsStatsOverlay } from '../components/HlsStatsOverlay';
import { HMSVideoPlayer } from '../components/HMSVideo';
import { FullScreenButton } from '../components/HMSVideo/FullscreenButton';
import { HLSAutoplayBlockedPrompt } from '../components/HMSVideo/HLSAutoplayBlockedPrompt';
import { HLSCaptionSelector } from '../components/HMSVideo/HLSCaptionSelector';
import { HLSQualitySelector } from '../components/HMSVideo/HLSQualitySelector';
import { HLSViewTitle } from '../components/HMSVideo/MwebHLSViewTitle';
import { HMSPlayerContext } from '../components/HMSVideo/PlayerContext';
import { LeaveRoom } from '../components/Leave/LeaveRoom';
import { ToastManager } from '../components/Toast/ToastManager';
import { Button } from '../../Button';
import { IconButton } from '../../IconButton';
import { Box, Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';
import { config, theme, useTheme } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import { useSidepaneToggle } from '../components/AppData/useSidepane';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsLandscape } from '../common/hooks';
import { APP_DATA, EMOJI_REACTION_TYPE, POLL_STATE, POLL_VIEWS, SIDE_PANE_OPTIONS } from '../common/constants';

let hlsPlayer;
const toastMap = {};

const ToggleChat = () => {
  const { elements } = useRoomLayoutConferencingScreen();
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const showChat = !!elements?.chat;
  const isMobile = useMedia(config.media.md);
  useEffect(() => {
    if (!sidepane && isMobile && showChat) {
      toggleChat();
    }
  }, [sidepane, isMobile, toggleChat, showChat]);
  return null;
};
const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef();
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const notification = useHMSNotifications(HMSNotificationTypes.POLL_STOPPED);
  const hmsActions = useHMSActions();
  const { themeType } = useTheme();
  const [streamEnded, setStreamEnded] = useState(false);
  let [hlsStatsState, setHlsStatsState] = useState(null);
  const hlsUrl = hlsState.variants[0]?.url;
  const [availableLayers, setAvailableLayers] = useState([]);
  const [isVideoLive, setIsVideoLive] = useState(true);
  const [isCaptionEnabled, setIsCaptionEnabled] = useState(true);
  const [hasCaptions, setHasCaptions] = useState(false);
  const [currentSelectedQuality, setCurrentSelectedQuality] = useState(null);
  const [isHlsAutoplayBlocked, setIsHlsAutoplayBlocked] = useState(false);
  const [isSeekEnabled, setIsSeekEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [show, toggle] = useToggle(false);
  const lastHlsUrl = usePrevious(hlsUrl);
  const vanillaStore = useHMSVanillaStore();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isUserSelectedAuto, setIsUserSelectedAuto] = useState(true);
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
  const controlsRef = useRef(null);
  const controlsTimerRef = useRef();
  const [seekProgress, setSeekProgress] = useState(false);
  const isFullScreenSupported = screenfull.isEnabled;

  const isMobile = useMedia(config.media.md);
  const isLandscape = useIsLandscape();

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
    if (!notification) return;
    const toastID = toastMap?.[notification.data.id];
    if (toastID) {
      ToastManager.removeToast(toastMap[notification.data.id]);
      delete toastMap[notification.data.id];
    }
  }, [notification]);

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

  const handleQuality = useCallback(
    quality => {
      if (hlsPlayer) {
        setIsUserSelectedAuto(quality.height?.toString().toLowerCase() === 'auto');
        hlsPlayer?.setLayer(quality);
      }
    },
    [availableLayers], //eslint-disable-line
  );
  /**
   * initialize HMSHLSPlayer and add event listeners.
   */
  useEffect(() => {
    let videoEl = videoRef.current;
    const manifestLoadedHandler = ({ layers }) => {
      setAvailableLayers(layers);
      setHasCaptions(hlsPlayer?.hasCaptions());
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
      const duration = rest.duration;
      const parsedPayload = parsePayload(payload);
      // check if poll happened
      if (parsedPayload.startsWith('poll:')) {
        const pollId = parsedPayload.substr(parsedPayload.indexOf(':') + 1);
        const poll = vanillaStore.getState(selectPollByID(pollId));
        const pollStartedBy = vanillaStore.getState(selectPeerNameByID(poll.startedBy)) || 'Participant';
        // launch poll
        if (!toastMap[pollId]) {
          const toastID = ToastManager.addToast({
            title: `${pollStartedBy} started a ${poll.type}: ${poll.title}`,
            action: (
              <Button
                onClick={() => {
                  hmsActions.setAppData({
                    [POLL_STATE.pollInView]: pollId,
                    [POLL_STATE.view]: POLL_VIEWS.VOTE,
                  });
                }}
                variant="standard"
                css={{
                  backgroundColor: '$surface_bright',
                  fontWeight: '$semiBold',
                  color: '$on_surface_high',
                  p: '$xs $md',
                }}
              >
                {poll.type === 'quiz' ? 'Answer' : 'Vote'}
              </Button>
            ),
            duration: Infinity,
          });
          toastMap[pollId] = toastID;
        }
        return;
      }
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
    const captionEnabledEventHandler = isCaptionEnabled => {
      setIsCaptionEnabled(isCaptionEnabled);
    };

    const handleAutoplayBlock = data => setIsHlsAutoplayBlocked(!!data);
    if (videoEl && hlsUrl) {
      hlsPlayer = new HMSHLSPlayer(hlsUrl, videoEl);
      hlsPlayer.on(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
      hlsPlayer.on(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, metadataLoadedHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.ERROR, handleError);
      hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.CAPTION_ENABLED, captionEnabledEventHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);

      hlsPlayer.on(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.LAYER_UPDATED, layerUpdatedHandler);
      return () => {
        hlsPlayer.off(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
        hlsPlayer.off(HMSHLSPlayerEvents.ERROR, handleError);
        hlsPlayer.off(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, metadataLoadedHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.CAPTION_ENABLED, captionEnabledEventHandler);

        hlsPlayer.off(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
        hlsPlayer.off(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.LAYER_UPDATED, layerUpdatedHandler);
        hlsPlayer.reset();
      };
    }
  }, [hlsUrl, vanillaStore, hmsActions]);

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

  const sfnOverlayClose = () => {
    hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats);
  };

  useEffect(() => {
    if (controlsVisible && isFullScreen && !qualityDropDownOpen) {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    }
    if (!isFullScreen && controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      if (!seekProgress) {
        setControlsVisible(false);
      }
    }, 5000);
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [controlsVisible, isFullScreen, seekProgress, qualityDropDownOpen]);

  const onSeekTo = useCallback(seek => {
    hlsPlayer?.seekTo(videoRef.current?.currentTime + seek);
  }, []);
  const onDoubleClickHandler = useCallback(
    event => {
      if (!(isMobile || isLandscape) || hlsState?.variants[0]?.playlist_type !== HLSPlaylistType.DVR) {
        return;
      }
      const sidePercentage = (event.screenX * 100) / event.target.clientWidth;
      setIsSeekEnabled(true);
      // there is space for pause/unpause button
      if (sidePercentage < 45) {
        onSeekTo(-10);
      } else {
        onSeekTo(10);
      }
      setTimeout(() => {
        setIsSeekEnabled(false);
      }, 200);
    },
    [hlsState?.variants, isLandscape, isMobile, onSeekTo],
  );
  const onClickHandler = useCallback(() => {
    if (!(isMobile || isLandscape)) {
      return;
    }
    setControlsVisible(value => !value);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
  }, [isLandscape, isMobile]);
  const onHoverHandler = useCallback(
    event => {
      event.preventDefault();
      if (isMobile || isLandscape) {
        return;
      }
      if (event.type === 'mouseenter' || qualityDropDownOpen) {
        setControlsVisible(true);
        return;
      }
      if (event.type === 'mouseleave' && !seekProgress) {
        setControlsVisible(false);
      } else if (!controlsVisible && event.type === 'mousemove') {
        setControlsVisible(true);
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
      }
    },
    [controlsVisible, isLandscape, isMobile, qualityDropDownOpen, seekProgress],
  );

  if (!hlsUrl || streamEnded) {
    return (
      <>
        <ToggleChat />
        {hlsViewRef.current && (isMobile || isLandscape) && (
          <Box css={{ position: 'fixed', left: '$4', top: '$4', zIndex: 11 }}>
            <LeaveRoom screenType="hls_live_streaming" container={hlsViewRef.current} />
          </Box>
        )}
        <Flex
          key="hls-viewer"
          id={`hls-viewer-${themeType}`}
          ref={hlsViewRef}
          direction={isMobile || isLandscape ? 'column' : 'row'}
          justify="center"
          css={{
            flex: isLandscape ? '2 1 0' : '1 1 0',
          }}
        >
          <Flex align="center" justify="center" direction="column" css={{ size: '100%', px: '$10' }}>
            <Flex css={{ c: '$on_surface_high', r: '$round', bg: '$surface_default', p: '$2' }}>
              {streamEnded ? <ColoredHandIcon height={56} width={56} /> : <GoLiveIcon height={56} width={56} />}
            </Flex>
            <Text variant="h5" css={{ c: '$on_surface_high', mt: '$10', mb: 0, textAlign: 'center' }}>
              {streamEnded ? 'Stream has ended' : 'Stream yet to start'}
            </Text>
            <Text variant="md" css={{ textAlign: 'center', mt: '$4', c: '$on_surface_medium' }}>
              {streamEnded ? 'Have a nice day!' : 'Sit back and relax'}
            </Text>
          </Flex>
        </Flex>
      </>
    );
  }
  return (
    <Flex
      key="hls-viewer"
      id={`hls-viewer-${themeType}`}
      ref={hlsViewRef}
      direction={isMobile || isLandscape ? 'column' : 'row'}
      justify="center"
      css={{
        flex: isLandscape ? '2 1 0' : '1 1 0',
        '&:fullscreen': {
          '& video': {
            height: 'unset !important',
          },
        },
      }}
    >
      {hlsViewRef.current && (isMobile || isLandscape) && (
        <Box css={{ position: 'fixed', left: '$4', top: '$4', zIndex: 11 }}>
          <LeaveRoom screenType="hls_live_streaming" container={hlsViewRef.current} />
        </Box>
      )}

      <HMSPlayerContext.Provider value={{ hlsPlayer }}>
        {hlsStatsState?.url && enablHlsStats && !(isMobile || isLandscape) ? (
          <HlsStatsOverlay hlsStatsState={hlsStatsState} onClose={sfnOverlayClose} />
        ) : null}
        <Flex
          id="hls-player-container"
          align="center"
          justify="center"
          css={{
            size: '100%',
            margin: '0 auto',
            '@md': {
              height: 'auto',
            },
          }}
        >
          {!(isMobile || isLandscape) && (
            <HLSAutoplayBlockedPrompt open={isHlsAutoplayBlocked} unblockAutoPlay={unblockAutoPlay} />
          )}
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
            onClick={onClickHandler}
            onDoubleClick={e => {
              onDoubleClickHandler(e);
            }}
          >
            <>
              {isMobile || isLandscape ? (
                <>
                  <Flex
                    align="center"
                    justify="center"
                    css={{
                      position: 'absolute',
                      bg: '#00000066',
                      display: 'inline-flex',
                      gap: '$2',
                      zIndex: 1,
                      size: '100%',
                      visibility: controlsVisible ? `` : `hidden`,
                      opacity: controlsVisible ? `1` : '0',
                    }}
                  >
                    {!showLoader && hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR && (
                      <>
                        <HMSVideoPlayer.Seeker
                          title="backward"
                          css={{
                            visibility: isSeekEnabled ? `` : `hidden`,
                            opacity: isSeekEnabled ? `1` : '0',
                          }}
                        >
                          <BackwardArrowIcon width={32} height={32} />
                        </HMSVideoPlayer.Seeker>
                        <Box
                          css={{
                            bg: 'rgba(0, 0, 0, 0.6)',
                            r: '$round',
                          }}
                        >
                          <HMSVideoPlayer.PlayPauseButton isPaused={isPaused} width={48} height={48} />
                        </Box>
                        <HMSVideoPlayer.Seeker
                          title="forward"
                          css={{
                            visibility: isSeekEnabled ? `` : `hidden`,
                            opacity: isSeekEnabled ? `1` : '0',
                          }}
                        >
                          <ForwardArrowIcon width={32} height={32} />
                        </HMSVideoPlayer.Seeker>
                      </>
                    )}
                  </Flex>
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
                      zIndex: 1,
                      visibility: controlsVisible ? `` : `hidden`,
                      opacity: controlsVisible ? `1` : '0',
                    }}
                  >
                    <HMSVideoPlayer.Controls.Root
                      css={{
                        p: '$4 $8',
                      }}
                    >
                      <HMSVideoPlayer.Controls.Right>
                        {isLandscape && <ChatToggle />}
                        {hasCaptions && !isHlsAutoplayBlocked && <HLSCaptionSelector isEnabled={isCaptionEnabled} />}
                        {hlsViewRef.current && availableLayers.length > 0 && !isHlsAutoplayBlocked ? (
                          <HLSQualitySelector
                            layers={availableLayers}
                            onOpenChange={setQualityDropDownOpen}
                            open={qualityDropDownOpen}
                            selection={currentSelectedQuality}
                            onQualityChange={handleQuality}
                            isAuto={isUserSelectedAuto}
                            containerRef={hlsViewRef.current}
                          />
                        ) : null}
                        <HLSAutoplayBlockedPrompt open={isHlsAutoplayBlocked} unblockAutoPlay={unblockAutoPlay} />
                      </HMSVideoPlayer.Controls.Right>
                    </HMSVideoPlayer.Controls.Root>
                  </Flex>
                </>
              ) : null}
              {controlsVisible && (
                <Flex
                  ref={controlsRef}
                  direction={isMobile ? 'columnReverse' : 'column'}
                  justify="end"
                  align="start"
                  css={{
                    position: 'absolute',
                    bottom: isFullScreen && hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR ? '$8' : '0',
                    left: '0',
                    zIndex: 1,
                    background:
                      isMobile || isLandscape
                        ? ''
                        : `linear-gradient(180deg, ${theme.colors.background_dim.value}00 29.46%, ${theme.colors.background_dim.value}A3 100%);`,
                    width: '100%',
                    pt: '$8',
                    flexShrink: 0,
                    transition: 'visibility 0s 0.5s, opacity 0.5s linear',
                  }}
                >
                  {hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR ? (
                    <HMSVideoPlayer.Progress seekProgress={seekProgress} setSeekProgress={setSeekProgress} />
                  ) : null}
                  <HMSVideoPlayer.Controls.Root
                    css={{
                      p: '$4 $8',
                    }}
                  >
                    <HMSVideoPlayer.Controls.Left>
                      {!(isMobile || isLandscape) && (
                        <>
                          {hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR ? (
                            <>
                              <HMSVideoPlayer.Seeker
                                onClick={() => {
                                  onSeekTo(-10);
                                }}
                                title="backward"
                              >
                                <BackwardArrowIcon width={20} height={20} />
                              </HMSVideoPlayer.Seeker>
                              <HMSVideoPlayer.PlayPauseButton isPaused={isPaused} />
                              <HMSVideoPlayer.Seeker
                                onClick={() => {
                                  onSeekTo(10);
                                }}
                                title="forward"
                              >
                                <ForwardArrowIcon width={20} height={20} />
                              </HMSVideoPlayer.Seeker>
                              {!isVideoLive ? <HMSVideoPlayer.Duration /> : null}
                            </>
                          ) : null}
                          <HMSVideoPlayer.Volume />
                        </>
                      )}
                      <IconButton
                        css={{ px: '$2' }}
                        onClick={async () => {
                          await hlsPlayer?.seekToLivePosition();
                          setIsVideoLive(true);
                        }}
                        key="jump-to-live_btn"
                        data-testid="jump-to-live_btn"
                      >
                        <Tooltip title={isVideoLive ? 'Live' : 'Go to Live'} side="top">
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
                              variant="$body1"
                              css={{
                                c: isVideoLive ? '$on_surface_high' : '$on_surface_medium',
                                fontWeight: '$semiBold',
                              }}
                            >
                              {isVideoLive ? 'LIVE' : 'GO LIVE'}
                            </Text>
                          </Flex>
                        </Tooltip>
                      </IconButton>
                      {(isMobile || isLandscape) &&
                      !isVideoLive &&
                      hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR ? (
                        <HMSVideoPlayer.Duration />
                      ) : null}
                    </HMSVideoPlayer.Controls.Left>

                    <HMSVideoPlayer.Controls.Right>
                      {hasCaptions && !(isMobile || isLandscape) && <HLSCaptionSelector isEnabled={isCaptionEnabled} />}
                      {availableLayers.length > 0 && !(isMobile || isLandscape) ? (
                        <HLSQualitySelector
                          layers={availableLayers}
                          onOpenChange={setQualityDropDownOpen}
                          open={qualityDropDownOpen}
                          selection={currentSelectedQuality}
                          onQualityChange={handleQuality}
                          isAuto={isUserSelectedAuto}
                        />
                      ) : null}
                      {isFullScreenSupported ? (
                        <FullScreenButton isFullScreen={isFullScreen} onToggle={toggle} />
                      ) : null}
                    </HMSVideoPlayer.Controls.Right>
                  </HMSVideoPlayer.Controls.Root>
                </Flex>
              )}
            </>
          </HMSVideoPlayer.Root>
        </Flex>
      </HMSPlayerContext.Provider>
      <ToggleChat />
      {isMobile && !isFullScreen && <HLSViewTitle />}
    </Flex>
  );
};

export default HLSView;
