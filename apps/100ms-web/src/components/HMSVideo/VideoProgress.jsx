import { useEffect, useState } from "react";
import { Slider } from "@100mslive/react-ui";

export const VideoProgress = ({ onValueChange, videoRef }) => {
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("timeupdate", _ => {
        const progress = Math.floor(
          (videoEl.currentTime / videoEl.duration) * 100
        );

        setVideoProgress(isNaN(progress) ? 0 : progress);
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
    <Slider
      showTooltip={false}
      step={1}
      css={{ width: "100%" }}
      value={[videoProgress]}
      onValueChange={sliderValueChangeHandler}
    />
  ) : null;
};
