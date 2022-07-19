import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { useHMSStore, selectHLSState } from "@100mslive/react-sdk";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExpandIcon,
  SettingIcon,
  ShrinkIcon,
} from "@100mslive/react-icons";
import {
  Box,
  Dropdown,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from "@100mslive/react-ui";
import { ChatView } from "../components/chatView";
import { useIsChatOpen } from "../components/AppData/useChatState";
import {
  HLSController,
  HLS_STREAM_NO_LONGER_LIVE,
  HLS_TIMED_METADATA_LOADED,
} from "../controllers/hls/HLSController";
import { ToastManager } from "../components/Toast/ToastManager";
import {
  HMSVideoPlayer,
  HMS_VIDEO_PLAYER_CTRL_FULLSCREEN,
  HMS_VIDEO_PLAYER_CTRL_PLAYBACK,
  HMS_VIDEO_PLAYER_CTRL_PROGRESS,
  HMS_VIDEO_PLAYER_CTRL_VOLUME,
} from "../components/HMSVideo/HMSVideo";

let hlsController;
const HLSView = () => {
  const videoRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const isChatOpen = useIsChatOpen();
  const hlsUrl = hlsState.variants[0]?.url;
  const [availableLevels, setAvailableLevels] = useState([]);
  const [currentSelectedQualityText, setCurrentSelectedQualityText] =
    useState("");
  const [isVideoLive, setIsVideoLive] = useState(true);
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && hlsUrl) {
      if (Hls.isSupported()) {
        hlsController = new HLSController(hlsUrl, videoRef);

        hlsController.on(HLS_STREAM_NO_LONGER_LIVE, () => {
          setIsVideoLive(false);
        });
        hlsController.on(HLS_TIMED_METADATA_LOADED, payload => {
          console.log(
            `%c Payload: ${payload}`,
            "color:#2b2d42; background:#d80032"
          );
          ToastManager.addToast({
            title: `Payload from timed Metadata ${payload}`,
          });
        });

        hlsController.on(Hls.Events.MANIFEST_LOADED, (_, { levels }) => {
          setAvailableLevels(levels);
          setCurrentSelectedQualityText("Auto");
        });
      } else if (
        videoRef.current.canPlayType("application/vnd.apple.mpegurl")
      ) {
        videoRef.current.src = hlsUrl;
      }
    }
  }, [hlsUrl]);

  useEffect(() => {
    if (hlsController) {
      return () => hlsController.reset();
    }
  }, []);

  const qualitySelectorHandler = useCallback(
    qualityLevel => {
      if (hlsController) {
        hlsController.setCurrentLevel(getCurrentLevel(qualityLevel));
        const levelText =
          qualityLevel.height === "auto" ? "Auto" : `${qualityLevel.height}p`;
        setCurrentSelectedQualityText(levelText);
      }
    },
    [availableLevels] //eslint-disable-line
  );

  /**
   *
   * @param {the current quality level clicked by the user. It is the level object } qualityLevel
   * @returns an integer ranging from 0 to (availableLevels.length - 1).
   * (e.g) if 4 levels are available, 0 is the lowest quality and 3 is the highest.
   *
   * This function is used rather than just using availableLevels.findIndex(quality) because, HLS gives the
   * levels in reverse.
   * (e.g) if available levels in the m3u8 are 360p,480p,720p,1080p,
   *
   * hls.levels gives us an array of level objects in the order [1080p,720p,480p,360p];
   *
   * so setting hls.currentLevel = availableLevels.getIndexOf(1080p) will set the stream to 360p instead of 1080p
   * because availableLevels.getIndexOf(1080p) will give 0 but level 0 is 360p.
   */
  const getCurrentLevel = qualityLevel => {
    if (qualityLevel.height === "auto") {
      return -1;
    }
    const index = availableLevels.findIndex(
      ({ url }) => url === qualityLevel.url
    );

    return availableLevels.length - 1 - index;
  };

  function toggleFullScreen() {
    const hlsviewer = document.getElementById("hls-viewer");
    if (hlsviewer && !isFullScreen) {
      hlsviewer.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  }

  return (
    <div
      key="hls-viewer"
      id="hls-viewer"
      style={{
        verticalAlign: "middle",
        display: "inline",
        height: "100%",
      }}
    >
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
          <HMSVideoPlayer
            controls={[
              HMS_VIDEO_PLAYER_CTRL_PROGRESS,
              HMS_VIDEO_PLAYER_CTRL_VOLUME,
              HMS_VIDEO_PLAYER_CTRL_PLAYBACK,
              HMS_VIDEO_PLAYER_CTRL_FULLSCREEN,
            ]}
            ref={videoRef}
            controlsToTheRight={() => {
              return (
                <>
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
                              height: "0.5rem",
                              width: "0.5rem",
                              background: isVideoLive ? "#CC525F" : "#FAFAFA",
                              borderRadius: "50%",
                            }}
                          />
                          <Text css={{ fontSize: "0.75rem" }}>
                            {isVideoLive ? "Live" : "Go to Live"}{" "}
                          </Text>
                        </Flex>
                      </Tooltip>
                    </IconButton>
                  ) : null}
                  <Dropdown.Root
                    css={{ margin: "0px" }}
                    open={qualityDropDownOpen}
                    onOpenChange={value => setQualityDropDownOpen(value)}
                  >
                    <Dropdown.Trigger asChild data-testid="quality_selector">
                      <Flex
                        css={{
                          color: "$textPrimary",
                          borderRadius: "$1",
                          margin: "0px",
                          cursor: "pointer",
                          zIndex: 40,
                          border: "1px solid $textDisabled",
                          padding: "$2 $4",
                        }}
                      >
                        <Tooltip title="Select Quality">
                          <Flex>
                            <SettingIcon />
                            <Text css={{ fontSize: "0.75rem" }} variant="md">
                              {currentSelectedQualityText}
                            </Text>
                          </Flex>
                        </Tooltip>

                        <Box
                          css={{
                            "@lg": { display: "none" },
                            color: "$textDisabled",
                          }}
                        >
                          {qualityDropDownOpen ? (
                            <ChevronUpIcon />
                          ) : (
                            <ChevronDownIcon />
                          )}
                        </Box>
                      </Flex>
                    </Dropdown.Trigger>
                    {availableLevels.length > 0 && (
                      <Dropdown.Content
                        sideOffset={5}
                        align="end"
                        css={{ height: "auto", maxHeight: "$96" }}
                      >
                        <Dropdown.Item
                          onClick={event =>
                            qualitySelectorHandler({ height: "auto" })
                          }
                          css={{
                            h: "auto",
                            flexDirection: "column",
                            flexWrap: "wrap",
                            cursor: "pointer",
                            alignItems: "flex-start",
                          }}
                          key="auto"
                        >
                          <Text>Automatic</Text>
                        </Dropdown.Item>
                        {availableLevels.map(level => {
                          return (
                            <Dropdown.Item
                              onClick={() => qualitySelectorHandler(level)}
                              css={{
                                h: "auto",
                                flexDirection: "column",
                                flexWrap: "wrap",
                                cursor: "pointer",
                                alignItems: "flex-start",
                              }}
                              key={level.url}
                            >
                              <Text>{`${level.height}p (${(
                                Number(level.bitrate / 1024) / 1024
                              ).toFixed(2)} Mbps)`}</Text>
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Content>
                    )}
                  </Dropdown.Root>
                </>
              );
            }}
            controlsConfig={{
              fullscreen: {
                onToggle: toggleFullScreen,
                icon: () => (isFullScreen ? <ShrinkIcon /> : <ExpandIcon />),
              },
            }}
          />
        </Flex>
      ) : (
        <Flex align="center" justify="center" css={{ size: "100%" }}>
          <Text variant="md" css={{ textAlign: "center" }}>
            Waiting for the Streaming to start...
          </Text>
        </Flex>
      )}
      {isChatOpen && (
        <Box
          css={{
            height: "50%",
            position: "absolute",
            zIndex: 40,
            bottom: "$20",
            right: 0,
            width: "20%",
            "@sm": {
              width: "75%",
            },
          }}
        >
          <ChatView />
        </Box>
      )}
    </div>
  );
};

export default HLSView;
