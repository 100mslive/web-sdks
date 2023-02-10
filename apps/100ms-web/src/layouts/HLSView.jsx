import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFullscreen, useToggle } from "react-use";
import { HLSController } from "@100mslve/hls-controllers";
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

let hlsController;

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
  const [isMSENotSupported, setIsMSENotSupported] = useState(false);
  const isFullScreenSupported = screenfull.isEnabled;
  const [show, toggle] = useToggle(false);
  const isFullScreen = useFullscreen(hlsViewRef, show, {
    onClose: () => toggle(false),
  });
  /**
   * initialize HLSController and add event listeners.
   */
  useEffect(() => {
    let videoEl = videoRef.current;
    const manifestLoadedHandler = (_, { levels }) => {
      console.log("levels ", levels);
      setAvailableLevels(levels);
    };
    const levelUpdatedHandler = (_, { level }) => {
      setCurrentSelectedQuality(level);
    };
    const metadataLoadedHandler = ({ payload, ...rest }) => {
      console.log(
        `%c Payload: ${payload}`,
        "color:#2b2d42; background:#d80032"
      );
      console.log(rest);
      ToastManager.addToast({
        title: `Payload from timed Metadata ${payload}`,
      });
    };

    const handleNoLongerLive = ({ isLive }) => {
      setIsVideoLive(isLive);
    };

    const playEventHandler = (_, data) => setIsPaused(!data);
    const pauseEventHandler = (_, data) => setIsPaused(data);
    const handleAutoplayBlock = (_, data) => setIsHlsAutoplayBlocked(data);

    if (videoEl && hlsUrl) {
      hlsController = new HLSController(hlsUrl, videoRef);
      hlsController.on(
        HLSController.Events.HLS_STREAM_NO_LONGER_LIVE,
        handleNoLongerLive
      );
      hlsController.on(
        HLSController.Events.HLS_TIMED_METADATA_LOADED,
        metadataLoadedHandler
      );
      hlsController.on(HLSController.Events.HLS_PLAY, playEventHandler);
      hlsController.on(HLSController.Events.HLS_PAUSE, pauseEventHandler);
      hlsController.on(
        HLSController.Events.HLS_AUTOPLAY_BLOCKED,
        handleAutoplayBlock
      );

      if (HLSController.isMSENotSupported()) {
        hlsController.on(
          HLSController.Events.HLS_MANIFEST_LOADED,
          manifestLoadedHandler
        );
        hlsController.on(
          HLSController.Events.HLS_LEVEL_UPDATED,
          levelUpdatedHandler
        );
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = hlsUrl;
        setIsMSENotSupported(true);
      }
    }
    return () => {
      hlsController?.off(
        HLSController.Events.HLS_STREAM_NO_LONGER_LIVE,
        handleNoLongerLive
      );
      hlsController?.off(
        HLSController.Events.HLS_TIMED_METADATA_LOADED,
        metadataLoadedHandler
      );
      hlsController?.off(HLSController.Events.HLS_PLAY, playEventHandler);
      hlsController?.off(HLSController.Events.HLS_PAUSE, pauseEventHandler);
      hlsController?.off(
        HLSController.Events.HLS_AUTOPLAY_BLOCKED,
        handleAutoplayBlock
      );
      hlsController?.off(
        HLSController.Events.HLS_MANIFEST_LOADED,
        manifestLoadedHandler
      );
      hlsController?.off(
        HLSController.Events.HLS_LEVEL_UPDATED,
        levelUpdatedHandler
      );
      hlsController?.reset();
      hlsController = null;
    };
  }, [hlsUrl]);

  /**
   * initialize and subscribe to hlsState
   */
  useEffect(() => {
    let unsubscribe;
    if (enablHlsStats) {
      console.log("enalble ");
      unsubscribe = hlsController.subscribe(state => {
        setHlsStatsState(state);
      });
    } else {
      unsubscribe?.();
    }
    return () => {
      unsubscribe?.();
    };
  }, [enablHlsStats]);

  const unblockAutoPlay = async () => {
    try {
      await videoRef.current?.play();
      console.debug("Successfully started playing the stream.");
      setIsHlsAutoplayBlocked(false);
    } catch (error) {
      console.error("Tried to unblock Autoplay failed with", error.toString());
    }
  };

  const handleQuality = useCallback(
    qualityLevel => {
      if (hlsController) {
        setIsUserSelectedAuto(
          qualityLevel.height.toString().toLowerCase() === "auto"
        );
        hlsController.setCurrentLevel(qualityLevel);
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
        verticalAlign: "middle",
        width: "100%",
        height: "100%",
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
            margin: "auto",
            height: "90%",
            "@md": { height: "90%" },
            "@lg": { height: "80%" },
          }}
        >
          <HLSAutoplayBlockedPrompt
            open={isHlsAutoplayBlocked}
            unblockAutoPlay={unblockAutoPlay}
          />
          <HMSVideoPlayer.Root ref={videoRef}>
            {!isMSENotSupported && (
              <HMSVideoPlayer.Progress videoRef={videoRef} />
            )}

            <HMSVideoPlayer.Controls.Root css={{ p: "$4 $8" }}>
              <HMSVideoPlayer.Controls.Left>
                <HMSVideoPlayer.PlayButton
                  onClick={() => {
                    isPaused
                      ? videoRef.current?.play()
                      : videoRef.current?.pause();
                  }}
                  isPaused={isPaused}
                />
                <HMSVideoPlayer.Duration videoRef={videoRef} />
                <HMSVideoPlayer.Volume videoRef={videoRef} />
              </HMSVideoPlayer.Controls.Left>

              <HMSVideoPlayer.Controls.Right>
                {!isMSENotSupported && hlsController ? (
                  <>
                    <IconButton
                      variant="standard"
                      css={{ px: "$2" }}
                      onClick={() => {
                        hlsController.jumpToLive();
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
