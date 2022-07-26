import { useEffect, useState } from "react";
import { Text } from "@100mslive/react-ui";
import { getDurationFromSeconds } from "./HMSVIdeoUtils";

export const VideoTime = ({ videoRef }) => {
  const [videoTime, setVideoTime] = useState("");

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("timeupdate", _ =>
        setVideoTime(getDurationFromSeconds(videoEl.currentTime))
      );
    }
    return function cleanup() {
      if (videoEl) {
        videoEl.removeEventListener("timeupdate", null);
      }
    };
  }, []);

  return videoRef.current ? <Text>{`${videoTime}`}</Text> : null;
};
