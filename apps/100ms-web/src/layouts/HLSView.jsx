import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFullscreen } from "react-use";
import Hls from "hls.js";
import {
  selectAppData,
  selectHLSState,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { HlsStats } from "@100mslive/hls-stats";
import { ExpandIcon, ShrinkIcon } from "@100mslive/react-icons";
import { Box, Flex, IconButton, Text, Tooltip } from "@100mslive/react-ui";

import { HMSVideoPlayer } from "../components/HMSVideo";
import { FullScreenButton } from "../components/HMSVideo/FullscreenButton";
import { HLSQualitySelector } from "../components/HMSVideo/HLSQualitySelector";

import { HlsStatsOverlay } from "../components/HlsStatsOverlay";
import { ToastManager } from "../components/Toast/ToastManager";
import {
  HLS_STREAM_NO_LONGER_LIVE,
  HLS_TIMED_METADATA_LOADED,
  HLSController,
} from "../controllers/hls/HLSController";
import { APP_DATA } from "../common/constants";

let hlsController;
let hlsStats;

const HLSView = () => {
  const videoRef = useRef(null);
  const hlsViewRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const enablHlsStats = useHMSStore(selectAppData(APP_DATA.hlsStats));
  const hmsActions = useHMSActions();
  let [hlsStatsState, setHlsStatsState] = useState(null);
  const hlsUrl = hlsState.variants[0]?.url;
  const [availableLevels, setAvailableLevels] = useState([]);
  const [isVideoLive, setIsVideoLive] = useState(true);

  const [currentSelectedQualityText, setCurrentSelectedQualityText] =
    useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  useFullscreen(hlsViewRef, isFullScreen, {
    onClose: () => setIsFullScreen(false),
  });

  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
  useEffect(() => {
    let videoEl = videoRef.current;
    if (videoEl && hlsUrl) {
      if (Hls.isSupported()) {
        hlsController = new HLSController(hlsUrl, videoRef);
        hlsStats = new HlsStats(hlsController.getHlsJsInstance(), videoEl);
        hlsController.on(HLS_STREAM_NO_LONGER_LIVE, () => {
          setIsVideoLive(false);
        });
        hlsController.on(HLS_TIMED_METADATA_LOADED, ({ payload, ...rest }) => {
          console.log(
            `%c Payload: ${payload}`,
            "color:#2b2d42; background:#d80032"
          );
          console.log(rest);
          ToastManager.addToast({
            title: `Payload from timed Metadata ${payload}`,
          });
        });

        hlsController.on(Hls.Events.MANIFEST_LOADED, (_, { levels }) => {
          const onlyVideoLevels = removeAudioLevels(levels);
          setAvailableLevels(onlyVideoLevels);
          setCurrentSelectedQualityText("Auto");
        });
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = hlsUrl;
      }
    }
    return () => {
      hlsStats = null;
    };
  }, [hlsUrl]);

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

  useEffect(() => {
    if (hlsController) {
      return () => hlsController.reset();
    }
  }, []);

  const qualitySelectorHandler = useCallback(
    qualityLevel => {
      if (hlsController) {
        hlsController.setCurrentLevel(qualityLevel);
        const levelText =
          qualityLevel.height === "auto" ? "Auto" : `${qualityLevel.height}p`;
        setCurrentSelectedQualityText(levelText);
      }
    },
    [availableLevels] //eslint-disable-line
  );

  function toggleFullScreen() {
    if (hlsViewRef) {
      setIsFullScreen(!isFullScreen);
    }
  }

  return (
    <Box
      key="hls-viewer"
      id="hls-viewer"
      ref={hlsViewRef}
      css={{
        verticalAlign: "middle",
        display: "inline",
        height: "100%",
      }}
    >
  const sfnOverlayClose = () => {
    hmsActions.setAppData(APP_DATA.hlsStats, !enablHlsStats);
  };

  return (
    <Fragment>
      {hlsStatsState?.url && enablHlsStats ? (
        <HlsStatsOverlay
          hlsStatsState={hlsStatsState}
          onClose={sfnOverlayClose}
        />
      ) : null}
      {hlsUrl ? (
        <Flex
          align="center"
          justify="center"
          css={{
            width: "95%",
            margin: "auto",
            height: "90%",
            "@md": { height: "90%" },
            "@lg": { height: "80%" },
          }}
        >
          <HMSVideoPlayer.Root ref={videoRef}>
            <HMSVideoPlayer.Progress videoRef={videoRef} />
            <HMSVideoPlayer.Controls.Root>
              <HMSVideoPlayer.Controls.Left>
                <HMSVideoPlayer.PlayButton
                  onClick={() => {
                    videoRef?.current?.paused
                      ? videoRef?.current?.play()
                      : videoRef?.current?.pause();
                    setIsPaused(Boolean(videoRef?.current?.paused));
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
                            borderRadius: "50%",
                          }}
                        />
                        <Text
                          variant={{
                            "@sm": "xs",
                          }}
                        >
                          {isVideoLive ? "Live" : "Go to Live"}{" "}
                        </Text>
                      </Flex>
                    </Tooltip>
                  </IconButton>
                ) : null}
                <HLSQualitySelector
                  availableLevels={availableLevels}
                  currentSelectedQualityText={currentSelectedQualityText}
                  qualitySelectorHandler={qualitySelectorHandler}
                />
                <FullScreenButton
                  onToggle={toggleFullScreen}
                  icon={isFullScreen ? <ShrinkIcon /> : <ExpandIcon />}
                />
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
    </Box>
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
