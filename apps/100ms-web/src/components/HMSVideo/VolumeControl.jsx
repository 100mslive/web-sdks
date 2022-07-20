import { useEffect, useState } from "react";
import { SpeakerIcon } from "@100mslive/react-icons";
import { Flex, Slider } from "@100mslive/react-ui";

export const VolumeControl = ({ videoEl }) => {
  const [volume, setVolume] = useState(75);
  useEffect(() => {
    if (volume === 0) {
      setVolume(videoEl ? videoEl.volume * 10 : 0);
    }
  }, []);

  return (
    <Flex align="center" css={{ color: "$white" }}>
      <SpeakerIcon style={{ cursor: "pointer" }} onClick={() => setVolume(0)} />
      <Slider
        css={{ mx: "$4", w: "$20" }}
        min={0}
        max={100}
        step={1}
        value={[volume]}
        onValueChange={volume => {
          videoEl.volume = volume / 100;
          setVolume(volume);
        }}
        thumbStyles={{ w: "$6", h: "$6" }}
      />
    </Flex>
  );
};
