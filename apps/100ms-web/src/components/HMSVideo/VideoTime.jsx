import { useEffect, useState } from "react";
import { Text } from "@100mslive/react-ui";

export const VideoTime = ({ videoRef }) => {
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

  return videoRef.current ? <Text>{`${videoTime}`}</Text> : null;
};
