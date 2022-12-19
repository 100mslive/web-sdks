import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFullscreen, useToggle } from "react-use";
import { HlsStats } from "@100mslive/hls-stats";
import Hls from "hls.js";
import { v4 } from "uuid";
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
  styled,
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
import {
  HLS_STREAM_NO_LONGER_LIVE,
  HLS_TIMED_METADATA_LOADED,
  HLSController,
} from "../controllers/hls/HLSController";
import { APP_DATA } from "../common/constants";

let hlsController;
let hlsStats;

const HTMLStyledVideo = styled("video", {
  margin: "0 auto",
  flex: "1 1 0",
  minHeight: 0,
  h: "100%",
});

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
      const onlyVideoLevels = removeAudioLevels(levels);
      setAvailableLevels(onlyVideoLevels);
    };
    const levelUpdatedHandler = (_, { level }) => {
      const qualityLevel = hlsController.getHlsJsInstance().levels[level];
      setCurrentSelectedQuality(qualityLevel);
    };
    const metadataLoadedHandler = ({ payload, ...rest }) => {
      console.log(
        `%c Payload: ${payload}`,
        "color:#2b2d42; background:#d80032"
      );
      console.log(rest);
      ToastManager.addToast({
        id: v4(),
        title: `Payload from timed Metadata ${payload}`,
      });
    };

    const handleNoLongerLive = () => {
      setIsVideoLive(false);
    };

    if (videoEl && hlsUrl) {
      if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        console.log("USING NATIVE PLAYER");
        videoEl.src = hlsUrl;
      } else if (Hls.isSupported()) {
        hlsController = new HLSController(hlsUrl, videoRef);
        hlsStats = new HlsStats(hlsController.getHlsJsInstance(), videoEl);

        hlsController.on(HLS_STREAM_NO_LONGER_LIVE, handleNoLongerLive);
        hlsController.on(HLS_TIMED_METADATA_LOADED, metadataLoadedHandler);

        hlsController.on(Hls.Events.MANIFEST_LOADED, manifestLoadedHandler);
        hlsController.on(Hls.Events.LEVEL_UPDATED, levelUpdatedHandler);
      }
    }
    return () => {
      hlsController?.off(Hls.Events.MANIFEST_LOADED, manifestLoadedHandler);
      hlsController?.off(Hls.Events.LEVEL_UPDATED, levelUpdatedHandler);
      hlsController?.off(HLS_TIMED_METADATA_LOADED, metadataLoadedHandler);
      hlsController?.off(HLS_STREAM_NO_LONGER_LIVE, handleNoLongerLive);
      hlsController?.reset();
      hlsStats = null;
      hlsController = null;
    };
  }, [hlsUrl]);

  /**
   * initialize and subscribe to hlsState
   */
  useEffect(() => {
    if (!hlsStats) {
      return;
    }
    let unsubscribe;
    if (enablHlsStats) {
      unsubscribe = hlsStats.subscribe(state => {
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

  /**
   * On mount. Add listeners for Video play/pause
   */
  useEffect(() => {
    const playEventHandler = () => setIsPaused(false);
    const pauseEventHandler = () => setIsPaused(true);
    const videoEl = videoRef.current;
    /**
     * we are doing all the modifications
     * to the video element after hlsUrl is loaded,
     * this is because, <HMSVideo/> is conditionally
     * rendered based on hlsUrl, so if we try to do
     * things before that, the videoRef.current will be
     * null.
     */
    if (!hlsUrl || !videoEl) {
      return;
    }

    const playVideo = async () => {
      try {
        if (videoEl.paused) {
          await videoEl.play();
        }
      } catch (error) {
        console.debug("Browser blocked autoplay with error", error.toString());
        console.debug("asking user to play the video manually...");
        if (error.name === "NotAllowedError") {
          setIsHlsAutoplayBlocked(true);
        }
      }
    };
    playVideo();

    videoEl.addEventListener("play", playEventHandler);
    videoEl.addEventListener("pause", pauseEventHandler);
    return () => {
      videoEl.removeEventListener("play", playEventHandler);
      videoEl.removeEventListener("pause", pauseEventHandler);
    };
  }, [hlsUrl]);

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

  const getContent = () => {
    const videoEl = videoRef.current;
    if (hlsUrl && videoEl?.canPlayType("application/vnd.apple.mpegurl")) {
      return <HTMLStyledVideo ref={videoRef} autoPlay controls playsInline />;
    } else if (hlsUrl && Hls.isSupported()) {
      return (
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
            <HMSVideoPlayer.Progress videoRef={videoRef} />
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
                {hlsController ? (
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
                    <Tooltip title="Go to Live">
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
                ) : null}
                <HLSQualitySelector
                  levels={availableLevels}
                  selection={currentSelectedQuality}
                  onQualityChange={handleQuality}
                  isAuto={isUserSelectedAuto}
                />
                <FullScreenButton
                  onToggle={toggle}
                  icon={isFullScreen ? <ShrinkIcon /> : <ExpandIcon />}
                />
              </HMSVideoPlayer.Controls.Right>
            </HMSVideoPlayer.Controls.Root>
          </HMSVideoPlayer.Root>
        </Flex>
      );
    } else {
      return (
        <Flex align="center" justify="center" css={{ size: "100%", px: "$10" }}>
          <Text variant="md" css={{ textAlign: "center" }}>
            Waiting for the stream to start...
          </Text>
        </Flex>
      );
    }
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
      {hlsStats && hlsStatsState?.url && enablHlsStats ? (
        <HlsStatsOverlay
          hlsStatsState={hlsStatsState}
          onClose={sfnOverlayClose}
        />
      ) : null}
      {/*<HLSAutoplayBlockedPrompt*/}
      {/*  open={isHlsAutoplayBlocked}*/}
      {/*  unblockAutoPlay={unblockAutoPlay}*/}
      {/*/>*/}
      {getContent()}
    </Flex>
  );
};

/**
 *
 * This function is needed because HLSJS currently doesn't
 * support switching to audio rendition from a video rendition.
 * more on this here
 * https://github.com/video-dev/hls.js/issues/4881
 * https://github.com/video-dev/hls.js/issues/3480#issuecomment-778799541
 * https://github.com/video-dev/hls.js/issues/163#issuecomment-169773788
 *
 * @param {Array} levels array from hlsJS
 * @returns a new array with only video levels.
 */
function removeAudioLevels(levels) {
  return levels.filter(
    ({ videoCodec, width, height }) => !!videoCodec || !!(width && height)
  );
}

export default HLSView;
