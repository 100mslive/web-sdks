import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFullscreen, useToggle } from "react-use";
import {
  HLSPlaybackState,
  HMSHLSPlayer,
  HMSHLSPlayerEvents,
} from "@100mslive/hls-player";
import screenfull from "screenfull";
import {
  selectAppData,
  selectHLSState,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { ExpandIcon, ShrinkIcon } from "@100mslive/react-icons";
import {
  Box,
  Flex,
  IconButton,
  Text,
  Tooltip,
  useTheme,
} from "@100mslive/react-ui";
import { HlsStatsOverlay } from "../components/HlsStatsOverlay";
import { HMSVideoPlayer } from "../components/HMSVideo";
import { FullScreenButton } from "../components/HMSVideo/FullscreenButton";
import { HLSAutoplayBlockedPrompt } from "../components/HMSVideo/HLSAutoplayBlockedPrompt";
import { HLSQualitySelector } from "../components/HMSVideo/HLSQualitySelector";
import { ToastManager } from "../components/Toast/ToastManager";
import { APP_DATA } from "../common/constants";

let hlsPlayer;

const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const hmsActions = useHMSActions();
  const { themeType } = useTheme();
  let [hlsStatsState, setHlsStatsState] = useState(null);
  const hlsUrl = hlsState.variants[0]?.url;
  const [availableLevels, setAvailableLevels] = useState([]);
  const [isVideoLive, setIsVideoLive] = useState(true);
  const [isUserSelectedAuto, setIsUserSelectedAuto] = useState(true);
  const [currentSelectedQuality, setCurrentSelectedQuality] = useState(null);
  const [isHlsAutoplayBlocked, setIsHlsAutoplayBlocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isFullScreenSupported = screenfull.isEnabled;
  const [show, toggle] = useToggle(false);
  const isFullScreen = useFullscreen(hlsViewRef, show, {
    onClose: () => toggle(false),
  });
  /**
   * initialize HMSHLSPlayer and add event listeners.
   */
  useEffect(() => {
    let videoEl = videoRef.current;
    const manifestLoadedHandler = (_, { levels }) => {
      setAvailableLevels(levels);
    };
    const levelUpdatedHandler = (_, { level }) => {
      setCurrentSelectedQuality(level);
    };
    const metadataLoadedHandler = (_, data) => {
      ToastManager.addToast({
        title: `Payload from timed Metadata ${data.payload}`,
      });
    };
    const handleError = (_, data) => {
      console.error("facing some error ", data);
    };
    const handleNoLongerLive = (_, { isLive }) => {
      setIsVideoLive(isLive);
    };

    const playbackEventHandler = (_, data) =>
      setIsPaused(data.state === HLSPlaybackState.paused);

    const handleAutoplayBlock = (_, data) => setIsHlsAutoplayBlocked(data);
    if (videoEl && hlsUrl) {
      hlsPlayer = new HMSHLSPlayer(hlsUrl, videoEl);
      hlsPlayer.on(
        HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE,
        handleNoLongerLive
      );
      hlsPlayer.on(
        HMSHLSPlayerEvents.TIMED_METADATA_LOADED,
        metadataLoadedHandler
      );
      hlsPlayer.on(HMSHLSPlayerEvents.ERROR, handleError);
      hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);

      hlsPlayer.on(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
      hlsPlayer.on(HMSHLSPlayerEvents.LEVEL_UPDATED, levelUpdatedHandler);
    }
    return () => {
      hlsPlayer?.off(
        HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE,
        handleNoLongerLive
      );
      hlsPlayer?.off(HMSHLSPlayerEvents.ERROR, handleError);
      hlsPlayer?.off(
        HMSHLSPlayerEvents.TIMED_METADATA_LOADED,
        metadataLoadedHandler
      );
      hlsPlayer?.off(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
      hlsPlayer?.off(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
      hlsPlayer?.off(HMSHLSPlayerEvents.MANIFEST_LOADED, manifestLoadedHandler);
      hlsPlayer?.off(HMSHLSPlayerEvents.LEVEL_UPDATED, levelUpdatedHandler);
      hlsPlayer?.reset();
      hlsPlayer = null;
    };
  }, [hlsUrl]);

  /**
   * initialize and subscribe to hlsState
   */
  useEffect(() => {
    const onHLSStats = (_, state) => setHlsStatsState(state);
    if (enablHlsStats) {
      hlsPlayer.on(HMSHLSPlayerEvents.STATS, onHLSStats);
    } else {
      hlsPlayer?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    }
    return () => {
      hlsPlayer?.off(HMSHLSPlayerEvents.STATS, onHLSStats);
    };
  }, [enablHlsStats]);

  const unblockAutoPlay = async () => {
    try {
      await hlsPlayer.unblockAutoPlay();
      setIsHlsAutoplayBlocked(false);
    } catch (error) {
      console.error("Tried to unblock Autoplay failed with", error.toString());
    }
  };

  const handleQuality = useCallback(
    qualityLevel => {
      if (hlsPlayer) {
        setIsUserSelectedAuto(
          qualityLevel.height.toString().toLowerCase() === "auto"
        );
        hlsPlayer.setCurrentLevel(qualityLevel);
      }
    },
    [availableLevels] //eslint-disable-line
  );

  const sfnOverlayClose = () => {
    hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats);
  };

  return (
    <Flex
      key="hls-viewer"
      id={`hls-viewer-${themeType}`}
      ref={hlsViewRef}
      css={{
        size: "100%",
      }}
    >
      {hlsStatsState?.url && enablHlsStats ? (
        <HlsStatsOverlay
          hlsStatsState={hlsStatsState}
          onClose={sfnOverlayClose}
        />
      ) : null}
      {hlsUrl ? (
        <Flex
          id="hls-player-container"
          align="center"
          justify="center"
          css={{
            width: "100%",
            margin: "0 auto",
            height: "100%",
          }}
        >
          <HLSAutoplayBlockedPrompt
            open={isHlsAutoplayBlocked}
            unblockAutoPlay={unblockAutoPlay}
          />
          <HMSVideoPlayer.Root ref={videoRef}>
            {hlsPlayer && (
              <HMSVideoPlayer.Progress
                onValueChange={currentTime => {
                  hlsPlayer.seekTo(currentTime);
                }}
                hlsPlayer={hlsPlayer}
              />
            )}

            <HMSVideoPlayer.Controls.Root css={{ p: "$4 $8" }}>
              <HMSVideoPlayer.Controls.Left>
                <HMSVideoPlayer.PlayButton
                  onClick={async () => {
                    isPaused ? await hlsPlayer?.play() : hlsPlayer?.pause();
                  }}
                  isPaused={isPaused}
                />
                <HMSVideoPlayer.Duration hlsPlayer={hlsPlayer} />
                <HMSVideoPlayer.Volume hlsPlayer={hlsPlayer} />
              </HMSVideoPlayer.Controls.Left>

              <HMSVideoPlayer.Controls.Right>
                {availableLevels.length > 0 ? (
                  <>
                    <IconButton
                      variant="standard"
                      css={{ px: "$2" }}
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
                              height: "$4",
                              width: "$4",
                              background: isVideoLive ? "$error" : "$white",
                              r: "$1",
                            }}
                          />
                          <Text
                            variant={{
                              "@sm": "xs",
                            }}
                          >
                            {isVideoLive ? "LIVE" : "GO LIVE"}
                          </Text>
                        </Flex>
                      </Tooltip>
                    </IconButton>
                    <HLSQualitySelector
                      levels={availableLevels}
                      selection={currentSelectedQuality}
                      onQualityChange={handleQuality}
                      isAuto={isUserSelectedAuto}
                    />
                  </>
                ) : null}
                {isFullScreenSupported ? (
                  <FullScreenButton
                    onToggle={toggle}
                    icon={isFullScreen ? <ShrinkIcon /> : <ExpandIcon />}
                  />
                ) : null}
              </HMSVideoPlayer.Controls.Right>
            </HMSVideoPlayer.Controls.Root>
          </HMSVideoPlayer.Root>
        </Flex>
      ) : (
        <Flex align="center" justify="center" css={{ size: "100%", px: "$10" }}>
          <Text variant="md" css={{ textAlign: "center" }}>
            Waiting for the stream to start...
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default HLSView;
