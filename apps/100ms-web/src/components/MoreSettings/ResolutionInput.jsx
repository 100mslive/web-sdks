import { HangUpIcon, InfoIcon } from "@100mslive/react-icons";
import { Flex, Input, Label, Text, Tooltip } from "@100mslive/react-ui";
import React, { useCallback, useState } from "react";
import {
  RTMP_RECORD_DEFAULT_RESOLUTION,
  RTMP_RECORD_RESOLUTION_MAX,
  RTMP_RECORD_RESOLUTION_MIN,
} from "../../common/constants";
import { DialogRow } from "../../primitives/DialogContent";
import { TextWithIcon } from "../Notifications/TextWithIcon";

export const ResolutionInput = ({
  onResolutionChange,
  disabled,
  disabledText,
}) => {
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
      <Tooltip title={disabledText}>
        <div>
          <InfoIcon color="#B0C3DB" />
        </div>
      </Tooltip>
      <Flex
        justify="between"
        css={{ width: "70%", "@sm": { width: "100%" } }}
        gap={2}
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
        </Flex>
      </Flex>
    </DialogRow>
  );
};
