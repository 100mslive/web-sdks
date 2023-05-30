import { Fragment } from "react";
import {
  selectIsAllowedToPublish,
  useHMSStore,
  useScreenShare,
} from "@100mslive/react-sdk";
import { ShareScreenIcon } from "@100mslive/react-icons";
import { Flex, Tooltip } from "@100mslive/react-ui";
import { ShareScreenOptions } from "./pdfAnnotator/shareScreenOptions";
import IconButton from "../IconButton";
import { useUISettings } from "./AppData/useUISettings";
import { isScreenshareSupported } from "../common/utils";
import { UI_SETTINGS } from "../common/constants";

export const ScreenshareToggle = ({ css }) => {
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const {
    amIScreenSharing,
    screenShareVideoTrackId: video,
    toggleScreenShare,
  } = useScreenShare();
  const isVideoScreenshare = amIScreenSharing && !!video;
  if (!isAllowedToPublish.screen || !isScreenshareSupported()) {
    return null;
  }

  return (
    <Fragment>
      <Flex direction="row">
        <Tooltip
          title={`${!isVideoScreenshare ? "Start" : "Stop"} screen sharing`}
        >
          <IconButton
            active={!isVideoScreenshare}
            css={css}
            disabled={isAudioOnly}
            onClick={() => {
              toggleScreenShare();
            }}
            data-testid="screen_share_btn"
          >
            <ShareScreenIcon />
          </IconButton>
        </Tooltip>
        <ShareScreenOptions />
      </Flex>
    </Fragment>
  );
};
