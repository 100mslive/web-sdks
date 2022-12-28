import React, { useCallback, useEffect, useState } from "react";
import {
  selectLocalPeerRoleName,
  selectRemotePeers,
  selectTracksMap,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { PipIcon } from "@100mslive/react-icons";
import { PictureInPicture } from "./PIPManager";
import { MediaSession } from "./SetupMediaSession";
import { IconButton } from "../IconButton";
import { Tooltip } from "../Tooltip";

const DEFAULT_HLS_VIEWER_ROLE = 'hls-viewer';
/**
 * shows a button which when clicked shows some videos in PIP, clicking
 * again turns it off.
 */
export const PIPComponent = () => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const [isPipOn, setIsPipOn] = useState<boolean>(PictureInPicture.isOn());
  const hmsActions = useHMSActions();
  const store = useHMSVanillaStore();

  const onPipToggle = useCallback(() => {
    if (!isPipOn) {
      PictureInPicture.start(hmsActions, (value: boolean) => setIsPipOn(value)).catch(err =>
        console.error("error in starting pip", err)
      );
      MediaSession.setup(hmsActions, store);
    } else {
      PictureInPicture.stop().catch(err =>
        console.error("error in stopping pip", err)
      );
    }
  }, [hmsActions, isPipOn, store]);

  // stop pip on unmount
  useEffect(() => {
    return () => {
      PictureInPicture.stop().catch(err =>
        console.error("error in stopping pip on unmount", err)
      );
    };
  }, []);

  if (
    !PictureInPicture.isSupported() ||
    localPeerRole === DEFAULT_HLS_VIEWER_ROLE
  ) {
    return null;
  }
  return (
    <>
      <Tooltip
        title={`${isPipOn ? "Deactivate" : "Activate"} picture in picture view`}
      >
        <IconButton
          active={!isPipOn}
          key="pip"
          onClick={() => onPipToggle()}
          data-testid="pip_btn"
        >
          <PipIcon />
        </IconButton>
      </Tooltip>
      {isPipOn && <ActivatedPIP  />}
    </>
  );
};

/**
 * this is a separate component so it can be conditionally rendered and
 * the subscriptions to store are done only if required.
 */
const ActivatedPIP = () => {
  const tracksMap = useHMSStore(selectTracksMap);
  const remotePeers = useHMSStore(selectRemotePeers);

  useEffect(() => {
    PictureInPicture.updatePeersAndTracks(remotePeers, tracksMap).catch(err => {
      console.error("error in updating pip", err);
    });
  }, [tracksMap, remotePeers]);

  return null;
};

