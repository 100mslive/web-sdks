import React, {
  useEffect,
  useRef,
  Fragment,
  useState,
  useCallback,
} from "react";
import Hls from "hls.js";
import { useHMSStore, selectHLSState } from "@100mslive/react-sdk";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HangUpIcon,
  PauseIcon,
  PlayIcon,
  RecordIcon,
  SettingIcon,
  SpeakerIcon,
} from "@100mslive/react-icons";
import {
  Box,
  Button,
  Dropdown,
  Flex,
  IconButton,
  Slider,
  styled,
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

const HLSVideo = styled("video", {
  h: "100%",
  margin: "0 auto",
});

let hlsController;
const HLSView = () => {
  const videoRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const isChatOpen = useIsChatOpen();
  const hlsUrl = hlsState.variants[0]?.url;
  // console.log("HLS URL", hlsUrl);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [isVideoLive, setIsVideoLive] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentSelectedQualityText, setCurrentSelectedQualityText] =
    useState("");
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);

  useEffect(() => {
    if (videoRef.current && hlsUrl) {
      if (Hls.isSupported()) {
        hlsController = new HLSController(hlsUrl, videoRef);

        videoRef.current.addEventListener("timeupdate", event => {
          const progress =
            (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setVideoProgress(isNaN(progress) ? 0 : progress);
        });
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

  return (
    <Fragment>
      {hlsUrl ? (
        <>
          <Flex
            align="center"
            justify={"center"}
            css={{ position: "absolute", right: "$4" }}
          >
            {hlsController ? (
              <Button
                variant="standard"
                css={{ marginRight: "0.3rem" }}
                onClick={() => {
                  hlsController.jumpToLive();
                  setIsVideoLive(true);
                }}
                key="LeaveRoom"
                data-testid="leave_room_btn"
              >
                <Tooltip title="Jump to Live">
                  <Flex>
                    <RecordIcon
                      color={isVideoLive ? "#CC525F" : "FAFAFA"}
                      key="jumpToLive"
                    />
                    Live
                  </Flex>
                </Tooltip>
              </Button>
            ) : null}
            <Dropdown.Root
              open={qualityDropDownOpen}
              onOpenChange={value => setQualityDropDownOpen(value)}
            >
              <Dropdown.Trigger asChild data-testid="quality_selector">
                <Flex
                  css={{
                    color: "$textPrimary",
                    borderRadius: "$1",
                    cursor: "pointer",
                    zIndex: 40,
                    border: "1px solid $textDisabled",
                    padding: "$2 $4",
                  }}
                >
                  <Tooltip title="Select Quality">
                    <Flex>
                      <SettingIcon />
                      <Text variant="md">{currentSelectedQualityText}</Text>
                    </Flex>
                  </Tooltip>

                  <Box
                    css={{ "@lg": { display: "none" }, color: "$textDisabled" }}
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
          </Flex>

          <Flex>
            <HLSVideo ref={videoRef} autoPlay controls playsInline />
          </Flex>
          <Slider
            step={1}
            value={[videoProgress]}
            onValueChange={progress => {
              console.log(progress);
              const currentTime = (progress * videoRef.current.duration) / 100;
              videoRef.current.currentTime = currentTime;
            }}
          />
          <Controls videoEl={videoRef.current} />
        </>
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
    </Fragment>
  );
};

const VolumeControl = ({ videoEl }) => {
  // console.log("VOLUME", videoEl.volume);
  return (
    <Flex align="center" css={{ color: "$white" }}>
      <SpeakerIcon />
      <Slider
        css={{ mx: "$4", w: "$20" }}
        min={0}
        max={100}
        step={1}
        value={[videoEl.volume * 100]}
        onValueChange={volume => {
          videoEl.volume = volume / 100;
        }}
        thumbStyles={{ w: "$6", h: "$6" }}
      />
    </Flex>
  );
};

const Controls = ({ videoEl, css = {} }) => {
  if (!videoEl) {
    return;
  }
  let time = Math.floor(videoEl.currentTime);
  const hours = Math.floor(time / 3600);
  time = time - hours * 3600;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time - minutes * 60);

  let videoTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  if (hours) {
    videoTime = `${hours}:${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }

  return (
    <Flex justify="start" align="center" gap={2} css={css}>
      <Flex align="center">
        <IconButton
          onClick={() => {
            videoEl.paused ? videoEl.play() : videoEl.pause();
          }}
          data-testid="playlist_play_pause_btn"
        >
          {videoEl.paused ? (
            <PlayIcon width={32} height={32} />
          ) : (
            <PauseIcon width={32} height={32} />
          )}
        </IconButton>
        <Text>{`${videoTime}`}</Text>
      </Flex>
      <VolumeControl videoEl={videoEl} />
    </Flex>
  );
};
export default HLSView;
