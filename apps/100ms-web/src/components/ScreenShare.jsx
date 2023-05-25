import { Fragment, useState } from "react";
import {
  selectIsAllowedToPublish,
  useHMSStore,
  useScreenShare,
} from "@100mslive/react-sdk";
import { ShareScreenIcon } from "@100mslive/react-icons";
import { IconButton, Tooltip } from "@100mslive/react-ui";
import { ShareScreenOptions } from "./pdfAnnotator/shareScreenOptions";
import { isScreenshareSupported } from "../common/utils";

export const ScreenshareToggle = ({ css }) => {
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const [openShareScreen, setOpenShareScreen] = useState(false);
  const { amIScreenSharing, screenShareVideoTrackId: video } = useScreenShare();
  const isVideoScreenshare = amIScreenSharing && !!video;
  if (!isAllowedToPublish.screen || !isScreenshareSupported()) {
    return null;
  }
  console.log("here ");

  return (
    <Fragment>
      <Tooltip
        title={`${!isVideoScreenshare ? "Start" : "Stop"} screen sharing`}
      >
        <IconButton
          active={!isVideoScreenshare}
          css={css}
          onClick={() => {
            setOpenShareScreen(true);
          }}
          data-testid="screen_share_btn"
        >
          <ShareScreenIcon />
        </IconButton>
      </Tooltip>
      {openShareScreen && (
        <ShareScreenOptions onOpenChange={setOpenShareScreen} />
      )}
    </Fragment>
  );
};
