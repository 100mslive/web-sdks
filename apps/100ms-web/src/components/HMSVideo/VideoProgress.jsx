import { useEffect, useState, useRef } from "react";
import { getPercentage } from "./HMSVIdeoUtils";

export const VideoProgress = ({ onValueChange, videoRef }) => {
  const [videoProgress, setVideoProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const progressRootRef = useRef();

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

        setVideoProgress(isNaN(videoProgress) ? 0 : videoProgress);
        setBufferProgress(isNaN(bufferProgress) ? 0 : bufferProgress);
      });
    }
    return function cleanup() {
      if (videoEl) {
        videoEl.removeEventListener("timeupdate", null);
      }
    };
  }, []);

  const onProgressChangeHandler = e => {
    const userClickedX = e.clientX - progressRootRef.current.offsetLeft;
    const progressBarWidth = progressRootRef.current.offsetWidth;
    const progress = Math.floor(getPercentage(userClickedX, progressBarWidth));
    const videoEl = videoRef.current;
    const currentTime = (progress * videoEl.duration) / 100;

    videoEl.currentTime = currentTime;
    if (onValueChange) {
      onValueChange(currentTime);
    }
  };

  return videoRef.current ? (
    <div
      justify="center"
      align="center"
      ref={progressRootRef}
      style={{ cursor: "pointer", display: "flex" }}
      onClick={onProgressChangeHandler}
    >
      <div
        id="video-actual"
        style={{
          display: "inline",
          width: `${videoProgress}%`,
          background: "#2471ED",
          height: "0.3rem",
        }}
      ></div>
      <div
        id="video-buffer"
        style={{
          width: `${bufferProgress - videoProgress}%`,
          background: "#143466",
          height: "0.3rem",
        }}
      ></div>
      <div
        id="video-rest"
        style={{
          width: `${100 - bufferProgress}%`,
          background: "#B0C3DB",
          height: "0.3rem",
        }}
      ></div>
    </div>
  ) : null;
};
