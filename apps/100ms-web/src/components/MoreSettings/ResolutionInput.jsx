<<<<<<< HEAD
import { HangUpIcon, InfoIcon } from "@100mslive/react-icons";
import { Flex, Input, Label, Text, Tooltip } from "@100mslive/react-ui";
=======
import { Flex, Input, Label } from "@100mslive/react-ui";
>>>>>>> origin/main
import React, { useCallback, useState } from "react";
import {
  RTMP_RECORD_DEFAULT_RESOLUTION,
  RTMP_RECORD_RESOLUTION_MAX,
  RTMP_RECORD_RESOLUTION_MIN,
} from "../../common/constants";
import { DialogRow } from "../../primitives/DialogContent";
<<<<<<< HEAD
import { TextWithIcon } from "../Notifications/TextWithIcon";

export const ResolutionInput = ({
  onResolutionChange,
  disabled,
  disabledText,
}) => {
=======

export const ResolutionInput = ({ onResolutionChange }) => {
>>>>>>> origin/main
  const [resolution, setResolution] = useState(RTMP_RECORD_DEFAULT_RESOLUTION);

  const resolutionChangeHandler = useCallback(
    event => {
      const { name, value } = event.target;
      const width = name === "resWidth" ? Number(value) : resolution.width;
      const height = name === "resHeight" ? Number(value) : resolution.height;

      const newResolution = {
        width: !isNaN(width) ? width : RTMP_RECORD_DEFAULT_RESOLUTION.width,
        height: !isNaN(height) ? height : RTMP_RECORD_DEFAULT_RESOLUTION.height,
      };
      setResolution(newResolution);
    },
    [resolution]
  );

  return (
    <DialogRow breakSm>
      <Label css={{ "@sm": { mb: "$8" } }}>Resolution</Label>
<<<<<<< HEAD
      <Tooltip title={disabledText}>
        <div>
          <InfoIcon color="#B0C3DB" />
        </div>
      </Tooltip>
=======
>>>>>>> origin/main
      <Flex
        justify="between"
        css={{ width: "70%", "@sm": { width: "100%" } }}
        gap={2}
<<<<<<< HEAD
        direction="column"
      >
        <Flex justify="between" gap={2}>
          <Flex direction="column" css={{ width: "50%" }}>
            <Text variant="xs">Width</Text>
            <Input
              css={{ width: "100%" }}
              name="resWidth"
              value={resolution.width}
              onChange={resolutionChangeHandler}
              readOnly={disabled}
              min={RTMP_RECORD_RESOLUTION_MIN}
              max={RTMP_RECORD_RESOLUTION_MAX}
              onBlur={() => onResolutionChange(resolution)}
              type="number"
            />
          </Flex>
          <Flex direction="column" css={{ width: "50%" }}>
            <Text variant="xs">Height</Text>
            <Input
              css={{ width: "100%" }}
              name="resHeight"
              value={resolution.height}
              onChange={resolutionChangeHandler}
              onBlur={() => onResolutionChange(resolution)}
              readOnly={disabled}
              min={RTMP_RECORD_RESOLUTION_MIN}
              max={RTMP_RECORD_RESOLUTION_MAX}
              type="number"
            />
          </Flex>
=======
      >
        <Flex direction="column" css={{ width: "50%" }}>
          <span>Width</span>
          <Input
            css={{ width: "100%" }}
            name="resWidth"
            value={resolution.width}
            onChange={resolutionChangeHandler}
            disabled={false}
            min={RTMP_RECORD_RESOLUTION_MIN}
            max={RTMP_RECORD_RESOLUTION_MAX}
            onBlur={() => onResolutionChange(resolution)}
            type="number"
          />
        </Flex>
        <Flex direction="column" css={{ width: "50%" }}>
          <span>Height</span>
          <Input
            css={{ width: "100%" }}
            name="resHeight"
            value={resolution.height}
            onChange={resolutionChangeHandler}
            onBlur={() => onResolutionChange(resolution)}
            disabled={false}
            min={RTMP_RECORD_RESOLUTION_MIN}
            max={RTMP_RECORD_RESOLUTION_MAX}
            type="number"
          />
>>>>>>> origin/main
        </Flex>
      </Flex>
    </DialogRow>
  );
};
