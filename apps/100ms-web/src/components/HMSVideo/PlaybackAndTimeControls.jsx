import { useState, useEffect } from "react";
import { PauseIcon, PlayIcon } from "@100mslive/react-icons";
import { Flex, IconButton, Text, Tooltip } from "@100mslive/react-ui";

export const PlaybackAndTimeControls = ({ videoRef }) => {
  const [videoTime, setVideoTime] = useState("");

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("timeupdate", _ => {
        let time = Math.floor(videoEl.currentTime);
        const hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time - minutes * 60);

        let videoTimeStr = `${minutes}:${
          seconds < 10 ? "0" + seconds : seconds
        }`;
        if (hours) {
          videoTimeStr = `${hours}:${minutes}:${
            seconds < 10 ? "0" + seconds : seconds
          }`;
        }

        setVideoTime(videoTimeStr);
      });
    }
    return function cleanup() {
      if (videoEl) {
        videoEl.removeEventListener("timeupdate", null);
      }
    };
  }, []);

  return videoRef.current ? (
    <Flex justify="start" align="center" gap={2}>
      <Tooltip title={`${videoRef.current.paused ? "Play" : "Pause"}`}>
        <IconButton
          onClick={() => {
            videoRef.current.paused
              ? videoRef.current.play()
              : videoRef.current.pause();
          }}
          data-testid="playlist_play_pause_btn"
        >
          {videoRef.current.paused ? (
            <PlayIcon width={32} height={32} />
          ) : (
            <PauseIcon width={32} height={32} />
          )}
        </IconButton>
      </Tooltip>
      <Text>{`${videoTime}`}</Text>
    </Flex>
  ) : null;
};
