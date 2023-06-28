import React from "react";
import { ExpandIcon } from "@100mslive/react-icons";
import { FEATURE_LIST } from "../../common/constants";
import { Dropdown, Text } from "../base-components";
import { useIsFeatureEnabled } from "../hooks/useFeatures";
import { useFullscreen } from "../hooks/useFullscreen";

export const FullScreenItem = () => {
  const { allowed, isFullscreen, toggleFullscreen } = useFullscreen();
  const isFullscreenEnabled = useIsFeatureEnabled(FEATURE_LIST.FULLSCREEN);

  if (!isFullscreenEnabled || !allowed) {
    return null;
  }

  return (
    <Dropdown.Item
      onClick={() => {
        toggleFullscreen();
      }}
      data-testid="full_screen_btn"
    >
      <ExpandIcon />
      <Text variant="sm" css={{ ml: "$4" }}>
        {isFullscreen ? "Exit " : "Go "}Fullscreen
      </Text>
    </Dropdown.Item>
  );
};
