import React, { useCallback, useEffect, useState } from "react";
import {
  HMSPeerID,
  selectLocalPeerRoleName,
  selectPeers,
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

export interface PIPComponentProps {
  /**
   * If list of peers are passed only they will be shown. if the selected peers video is not on,
   * they will not be shown
   */
  peers?: HMSPeerID[];
  /**
   * By default local peer is not shown in PIP. To include local peer, pass this flag
   */
  showLocalPeer?: boolean;
}
/**
 * shows a button which when clicked shows some videos in PIP, clicking
 * again turns it off.
 * Note: Only a maximum of four tiles are shown at any given point
 */
export const PIPComponent = ({ peers, showLocalPeer }: PIPComponentProps) => {
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
      {isPipOn && <ActivatedPIP peers={peers} showLocalPeer={showLocalPeer} />}
    </>
  );
};

/**
 * this is a separate component so it can be conditionally rendered and
 * the subscriptions to store are done only if required.
 */
const ActivatedPIP = ({ peers, showLocalPeer }: PIPComponentProps) => {
  const tracksMap = useHMSStore(selectTracksMap);
  const remotePeers = useHMSStore(showLocalPeer ? selectPeers : selectRemotePeers);
  const [pipPeers, setPipPeers] = useState(remotePeers);

  useEffect(() => {
    if(peers) {
      setPipPeers(pipPeers => pipPeers.filter(peer => peers.includes(peer.id)));
    }
  }, [peers]);

  useEffect(() => {
    PictureInPicture.updatePeersAndTracks(pipPeers, tracksMap).catch(err => {
      console.error("error in updating pip", err);
    });
  }, [tracksMap, pipPeers]);

  return null;
};

