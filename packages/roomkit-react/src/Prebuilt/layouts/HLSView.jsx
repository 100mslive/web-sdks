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
import { ColoredHandIcon, GoLiveIcon, PauseIcon, PlayIcon } from '@100mslive/react-icons';
import { ChatToggle } from '../components/Footer/ChatToggle';
import { HlsStatsOverlay } from '../components/HlsStatsOverlay';
import { HMSVideoPlayer } from '../components/HMSVideo';
import { FullScreenButton } from '../components/HMSVideo/FullscreenButton';
import { HLSAutoplayBlockedPrompt } from '../components/HMSVideo/HLSAutoplayBlockedPrompt';
import { HLSCaptionSelector } from '../components/HMSVideo/HLSCaptionSelector';
import { HLSQualitySelector } from '../components/HMSVideo/HLSQualitySelector';
import { HLSViewTitle } from '../components/HMSVideo/MwebHLSViewTitle';
import { HMSPlayerContext } from '../components/HMSVideo/PlayerContext';
import { ToastManager } from '../components/Toast/ToastManager';
import { Button } from '../../Button';
import { IconButton } from '../../IconButton';
import { Box, Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';
import { config, theme, useTheme } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import { usePollViewToggle, useSidepaneToggle } from '../components/AppData/useSidepane';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsLandscape } from '../common/hooks';
import { APP_DATA, EMOJI_REACTION_TYPE, SIDE_PANE_OPTIONS } from '../common/constants';

let hlsPlayer;
const toastMap = {};

const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const { elements, screenType } = useRoomLayoutConferencingScreen();
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
  const [isPaused, setIsPaused] = useState(false);
  const [show, toggle] = useToggle(false);
  const lastHlsUrl = usePrevious(hlsUrl);
  const togglePollView = usePollViewToggle();
  const vanillaStore = useHMSVanillaStore();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isUserSelectedAuto, setIsUserSelectedAuto] = useState(true);
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
  const controlsRef = useRef(null);
  const controlsTimerRef = useRef();
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const showChat = !!elements?.chat;
  const isFullScreenSupported = screenfull.isEnabled;

  const isMobile = useMedia(config.media.md);
  const isLandscape = useIsLandscape();

  const isFullScreen = useFullscreen(hlsViewRef, show, {
    onClose: () => toggle(false),
  });
  const [showLoader, setShowLoader] = useState(false);

  const isMwebHLSStream = screenType === 'hls_live_streaming' && isMobile;

  useEffect(() => {
    if (sidepane === '' && isMwebHLSStream && showChat) {
      toggleChat();
    }
  }, [sidepane, isMwebHLSStream, toggleChat, showChat]);
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
        const toastID = ToastManager.addToast({
          title: `${pollStartedBy} started a ${poll.type}: ${poll.title}`,
          action: (
            <Button
              onClick={() => togglePollView(pollId)}
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
  }, [hlsUrl, togglePollView, vanillaStore]);

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

  const onTouchHandler = useCallback(
    event => {
      event.preventDefault();
      // logic for invisible when tapping
      if (event.type === 'ontouchstart' && controlsVisible) {
        setControlsVisible(false);
        return;
      }
      // normal scemnario
      if (event.type === 'ontouchstart' || qualityDropDownOpen) {
        setControlsVisible(true);
        return;
      }
      if (isFullScreen && !controlsVisible && event.type === 'touchmove') {
        setControlsVisible(true);
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
      }
    },
    [controlsVisible, isFullScreen, qualityDropDownOpen],
  );
  const onHoverHandler = useCallback(
    event => {
      // normal scemnario
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
      direction={isMobile || isLandscape ? 'column' : 'row'}
      css={{
        w: sidepane !== '' && isLandscape ? '55%' : '100%',
        h: sidepane !== '' && isMobile ? '36%' : '100%',
      }}
    >
      {hlsUrl && !streamEnded ? (
        <>
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
                onTouchStart={onTouchHandler}
                onTouchMove={onTouchHandler}
              >
                <>
                  {isMobile || isLandscape ? (
                    <>
                      {!showLoader && (
                        <Box
                          css={{
                            position: 'absolute',
                            top: '40%',
                            left: '50%',
                            transform: 'translateY(-40%) translateX(-50%)',
                            padding: '$4',
                            display: 'inline-flex',
                            r: '$round',
                            gap: '$1',
                            bg: 'rgba(0, 0, 0, 0.6)',
                            zIndex: 1,
                            visibility: controlsVisible ? `` : `hidden`,
                            opacity: controlsVisible ? `1` : '0',
                          }}
                        >
                          {isPaused ? (
                            <IconButton
                              onClick={async () => {
                                await hlsPlayer?.play();
                              }}
                              data-testid="play_btn"
                            >
                              <PlayIcon width="48px" height="48px" />
                            </IconButton>
                          ) : (
                            <IconButton
                              onClick={async () => {
                                await hlsPlayer?.pause();
                              }}
                              data-testid="pause_btn"
                            >
                              <PauseIcon width="48px" height="48px" />
                            </IconButton>
                          )}
                        </Box>
                      )}
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
                          <HMSVideoPlayer.Controls.Right>
                            {isLandscape && <ChatToggle />}
                            {hasCaptions && <HLSCaptionSelector isEnabled={isCaptionEnabled} />}
                            {availableLayers.length > 0 ? (
                              <HLSQualitySelector
                                layers={availableLayers}
                                onOpenChange={setQualityDropDownOpen}
                                open={qualityDropDownOpen}
                                selection={currentSelectedQuality}
                                onQualityChange={handleQuality}
                                isAuto={isUserSelectedAuto}
                              />
                            ) : null}
                          </HMSVideoPlayer.Controls.Right>
                        </HMSVideoPlayer.Controls.Root>
                      </Flex>
                    </>
                  ) : null}
                  <Flex
                    ref={controlsRef}
                    direction="column"
                    justify="end"
                    align="start"
                    css={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      background:
                        isMobile || isLandscape
                          ? ''
                          : `linear-gradient(180deg, ${theme.colors.background_dim.value}00 29.46%, ${theme.colors.background_dim.value}A3 100%);`,
                      width: '100%',
                      pt: '$8',
                      flexShrink: 0,
                      transition: 'visibility 0s 0.5s, opacity 0.5s linear',
                      visibility: controlsVisible ? `` : `hidden`,
                      opacity: controlsVisible ? `1` : '0',
                    }}
                  >
                    {!(isMobile || isLandscape) && hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR && (
                      <HMSVideoPlayer.Progress />
                    )}
                    <HMSVideoPlayer.Controls.Root
                      css={{
                        p: '$4 $8',
                      }}
                    >
                      <HMSVideoPlayer.Controls.Left>
                        {!(isMobile || isLandscape) && (
                          <>
                            <HMSVideoPlayer.PlayButton
                              onClick={async () => {
                                isPaused ? await hlsPlayer?.play() : hlsPlayer?.pause();
                              }}
                              isPaused={isPaused}
                            />
                            {!isVideoLive ? <HMSVideoPlayer.Duration /> : null}
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
                        {(isMobile || isLandscape) && !isVideoLive ? <HMSVideoPlayer.Duration /> : null}
                      </HMSVideoPlayer.Controls.Left>

                      <HMSVideoPlayer.Controls.Right>
                        {hasCaptions && !(isMobile || isLandscape) && (
                          <HLSCaptionSelector isEnabled={isCaptionEnabled} />
                        )}
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
                    {(isMobile || isLandscape) && hlsState?.variants[0]?.playlist_type === HLSPlaylistType.DVR ? (
                      <HMSVideoPlayer.Progress />
                    ) : null}
                  </Flex>
                </>
              </HMSVideoPlayer.Root>
            </Flex>
          </HMSPlayerContext.Provider>

          {isMobile && !isFullScreen && <HLSViewTitle />}
        </>
      ) : (
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
      )}
    </Flex>
  );
};

export default HLSView;
