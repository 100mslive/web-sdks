import { useState } from "react";
import { SpeakerIcon } from "@100mslive/react-icons";
import { Flex, Slider } from "@100mslive/react-ui";

export const VolumeControl = ({ hlsController }) => {
  const [volume, setVolume] = useState(hlsController?.volume ?? 100);

  return (
    <Flex align="center" css={{ color: "$white" }}>
      <SpeakerIcon
        style={{ cursor: "pointer" }}
        onClick={() => {
          setVolume(0);
          if (hlsController) {
            hlsController.setVolume(0);
          }
        }}
      />
      <Slider
        css={{
          mx: "$4",
          w: "$20",
          cursor: "pointer",
          "@sm": { w: "$14" },
          "@xs": { w: "$14" },
        }}
        min={0}
        max={100}
        step={1}
        value={[volume]}
        onValueChange={volume => {
          hlsController.setVolume(volume);
          setVolume(volume);
        }}
        thumbStyles={{ w: "$6", h: "$6" }}
      />
    </Flex>
  );
};
