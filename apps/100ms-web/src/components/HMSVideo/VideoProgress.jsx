import { useEffect, useState } from "react";
import { Flex, Slider } from "@100mslive/react-ui";
import { getPercentage } from "./HMSVIdeoUtils";

export const VideoProgress = ({ onValueChange, videoRef }) => {
  const [videoProgress, setVideoProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("timeupdate", _ => {
        const videoProgress = Math.floor(
          getPercentage(videoEl.currentTime, videoEl.duration)
        );

        const bufferProgress = Math.floor(
          getPercentage(videoEl.buffered.end(0), videoEl.duration)
        );
        if (videoRef.current) {
          for (let i = 0; i < videoRef.current.buffered.length; i++) {
            // console.log("BUFFER", i, videoRef.current?.buffered.end(i));
          }
          // console.log("CURRENT", videoRef.current?.currentTime);
        }

        setVideoProgress(isNaN(videoProgress) ? 0 : videoProgress);
        setBufferProgress(isNaN(bufferProgress) ? 0 : bufferProgress);
        // console.log(
        //   "PROGRESS",
        //   "CURRENT",
        //   videoProgress,
        //   "BUFFERED",
        //   bufferProgress
        // );
      });
    }
    return function cleanup() {
      if (videoEl) {
        videoEl.removeEventListener("timeupdate", null);
      }
    };
  }, []);

  const sliderValueChangeHandler = progress => {
    const videoEl = videoRef.current;
    const currentTime = (progress * videoEl.duration) / 100;
    videoEl.currentTime = currentTime;
    if (onValueChange) {
      onValueChange(currentTime);
    }
  };
  return videoRef.current ? (
    <>
      {/* <Slider
        showTooltip={false}
        step={1}
        css={{ width: "100%" }}
        value={[videoProgress]}
        onValueChange={sliderValueChangeHandler}
      /> */}
      <Flex
        justify="center"
        align="center"
        css={{ cursor: "pointer" }}
        onClick={e => {
          console.log(e.clientX, e.nativeEvent.offsetX, e.screenX);
        }}
      >
        <div
          id="video-actual"
          style={{
            display: "inline",
            width: `${videoProgress}%`,
            background: "#2471ED",
            height: "0.5rem",
          }}
        ></div>
        <div
          id="video-buffer"
          style={{
            // display: "inline",
            width: `${bufferProgress - videoProgress}%`,
            background: "#143466",
            height: "0.5rem",
          }}
        ></div>
        <div
          id="video-rest"
          style={{
            // display: "inline",
            width: `${100 - bufferProgress}%`,
            background: "#B0C3DB",
            height: "0.5rem",
          }}
        ></div>
      </Flex>
    </>
  ) : null;
};
