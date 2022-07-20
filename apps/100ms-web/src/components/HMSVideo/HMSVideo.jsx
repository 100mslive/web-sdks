import React, { useEffect, useState, forwardRef } from "react";
import { Flex, IconButton, Slider, Tooltip } from "@100mslive/react-ui";

import { PlaybackAndTimeControls } from "./PlaybackAndTimeControls";
import { VolumeControl } from "./VolumeControl";

export const HMS_VIDEO_PLAYER_CTRL_FULLSCREEN = "fullscreen";
export const HMS_VIDEO_PLAYER_CTRL_PROGRESS = "progress";
export const HMS_VIDEO_PLAYER_CTRL_PLAYBACK = "playback";
export const HMS_VIDEO_PLAYER_CTRL_VOLUME = "volume";

export const HMSVideoPlayer = forwardRef(
  ({ controls, controlsConfig, controlsToTheRight }, videoRef) => {
    const [videoProgress, setVideoProgress] = useState(0);
    const progressBarConfig = controlsConfig[HMS_VIDEO_PLAYER_CTRL_PROGRESS];
    const fullscreenConfig = controlsConfig[HMS_VIDEO_PLAYER_CTRL_FULLSCREEN];
    const checkForControls = controlName => controls.includes(controlName);

    useEffect(() => {
      const videoEl = videoRef?.current;
      if (videoEl) {
        videoEl.addEventListener("timeupdate", event => {
          const progress = Math.floor(
            (videoEl.currentTime / videoEl.duration) * 100
          );
          setVideoProgress(isNaN(progress) ? 0 : progress);
        });
      }
      return function cleanup() {
        if (videoEl) {
          videoEl.removeEventListener("timeupdate");
        }
      };
    }, []);

    const sliderValueChangeHandler = progress => {
      const currentTime = (progress * videoRef.current.duration) / 100;
      videoRef.current.currentTime = currentTime;
      if (progressBarConfig.onValueChange) {
        progressBarConfig.onValueChange(currentTime);
      }
    };
    return (
      <div id="hms-video" style={{ height: "100%", width: "100%" }}>
        <video
          style={{ height: "100%", margin: "auto" }}
          ref={videoRef}
          autoPlay
          playsInline
        />
        {checkForControls(HMS_VIDEO_PLAYER_CTRL_PROGRESS) ? (
          <Slider
            showTooltip={false}
            step={1}
            css={{ width: "100%" }}
            value={[videoProgress]}
            onValueChange={sliderValueChangeHandler}
          />
        ) : null}

        {checkForControls(HMS_VIDEO_PLAYER_CTRL_PLAYBACK) ? (
          <Flex
            justify="between"
            align="center"
            gap={2}
            css={{ width: "100%" }}
          >
            <Flex
              justify="start"
              align="center"
              gap={2}
              css={{ width: "100%" }}
            >
              {checkForControls(HMS_VIDEO_PLAYER_CTRL_PLAYBACK) ? (
                <PlaybackAndTimeControls videoEl={videoRef.current} />
              ) : null}
              {checkForControls(HMS_VIDEO_PLAYER_CTRL_VOLUME) ? (
                <VolumeControl videoEl={videoRef.current} />
              ) : null}
            </Flex>
            <Flex
              justify="end"
              align="center"
              css={{ width: "100%", margin: "0px" }}
              gap={2}
            >
              {controlsToTheRight ? controlsToTheRight() : null}
              {checkForControls(HMS_VIDEO_PLAYER_CTRL_FULLSCREEN) ? (
                <IconButton
                  variant="standard"
                  css={{ margin: "0px" }}
                  onClick={fullscreenConfig?.onToggle}
                  key={HMS_VIDEO_PLAYER_CTRL_FULLSCREEN}
                  data-testid="fullscreen_btn"
                >
                  <Tooltip title="Go to fullscreen">
                    <Flex>{fullscreenConfig.icon()}</Flex>
                  </Tooltip>
                </IconButton>
              ) : null}
            </Flex>
          </Flex>
        ) : null}
      </div>
    );
  }
);

const ControlsToTheRight = ({children}) {
  return <>
  {children}
  </>
}
export const HMSVideoControls = {
  Left:ControlsToTheRight
}
