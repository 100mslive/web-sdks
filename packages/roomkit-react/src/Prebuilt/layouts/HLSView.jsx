import React, { useEffect, useRef, useState } from 'react';
import { useFullscreen, useMedia, usePrevious, useToggle } from 'react-use';
import { HLSPlaybackState, HMSHLSPlayer, HMSHLSPlayerEvents } from '@100mslive/hls-player';
import {
  selectAppData,
  selectHLSState,
  selectPeerNameByID,
  selectPollByID,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { ColoredHandIcon, RadioIcon } from '@100mslive/react-icons';
import { HlsStatsOverlay } from '../components/HlsStatsOverlay';
import { DesktopHLSView } from '../components/HMSVideo/DesktopHLSView';
import { HLSAutoplayBlockedPrompt } from '../components/HMSVideo/HLSAutoplayBlockedPrompt';
import { HLSViewTitle, MwebHLSView } from '../components/HMSVideo/MwebHLSView';
import { HMSPlayerContext, useSetHMSPlayerContext } from '../components/HMSVideo/PlayerContext';
import { ToastManager } from '../components/Toast/ToastManager';
import { Button } from '../../Button';
import { Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';
import { config, useTheme } from '../../Theme';
import { usePollViewToggle, useSidepaneToggle } from '../components/AppData/useSidepane';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { APP_DATA, EMOJI_REACTION_TYPE, SIDE_PANE_OPTIONS } from '../common/constants';

let hlsPlayer;

const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const { elements, screenType } = useRoomLayoutConferencingScreen();
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
  const [hlsPlayerContext, setHLSPlayerContext] = useSetHMSPlayerContext();
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const showChat = !!elements?.chat;

  const isMobile = useMedia(config.media.md);
  const isLandscape = useMedia(config.media.ls);

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
      setHasCaptions(hlsPlayerContext?.hasCaptions());
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
        ToastManager.addToast({
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
        });
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
      setHLSPlayerContext(hlsPlayer);
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
        setHLSPlayerContext(undefined);
      };
    }
  }, [hlsUrl]);

  /**
   * initialize and subscribe to hlsState
   */
  useEffect(() => {
    const onHLSStats = state => setHlsStatsState(state);
    if (enablHlsStats) {
      hlsPlayerContext?.on(HMSHLSPlayerEvents.STATS, onHLSStats);
    } else {
      hlsPlayerContext?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    }
    return () => {
      hlsPlayerContext?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    };
  }, [enablHlsStats]);

  const unblockAutoPlay = async () => {
    try {
      await hlsPlayerContext.play();
      setIsHlsAutoplayBlocked(false);
    } catch (error) {
      console.error('Tried to unblock Autoplay failed with', error.message);
    }
  };

  const sfnOverlayClose = () => {
    hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats);
  };

  if (isMobile || isLandscape) {
    return (
      <Flex
        key="hls-viewer"
        id={`hls-viewer-${themeType}`}
        ref={hlsViewRef}
        direction="column"
        justify="center"
        css={{
          w: sidepane !== '' && isLandscape ? '55%' : '100%',
          h: sidepane !== '' && isMobile ? '36%' : '100%',
        }}
      >
        {hlsUrl && !streamEnded ? (
          <>
            <HMSPlayerContext.Provider value={{ hlsPlayer }}>
              <Flex
                id="hls-player-container"
                align="center"
                justify="center"
                css={{
                  width: '100%',
                  margin: '0 auto',
                  height: isFullScreen || sidepane !== '' || isLandscape ? '100%' : '36%',
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
                <MwebHLSView
                  ref={videoRef}
                  isFullScreen={isFullScreen}
                  isLoading={showLoader}
                  isPaused={isPaused}
                  hasCaptions={hasCaptions}
                  isCaptionEnabled={isCaptionEnabled}
                  isVideoLive={isVideoLive}
                  availableLayers={availableLayers}
                  currentSelectedQuality={currentSelectedQuality}
                  setIsVideoLive={setIsVideoLive}
                  toggle={toggle}
                />
              </Flex>
            </HMSPlayerContext.Provider>
            {!isLandscape && <HLSViewTitle />}
          </>
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
  }
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
        <HMSPlayerContext.Provider value={{ hlsPlayer }}>
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
            <DesktopHLSView
              ref={videoRef}
              isFullScreen={isFullScreen}
              isPaused={isPaused}
              hasCaptions={hasCaptions}
              isCaptionEnabled={isCaptionEnabled}
              isVideoLive={isVideoLive}
              availableLayers={availableLayers}
              currentSelectedQuality={currentSelectedQuality}
              setIsVideoLive={setIsVideoLive}
              toggle={toggle}
            />
          </Flex>
        </HMSPlayerContext.Provider>
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
