import React, { useCallback, useEffect, useState } from 'react';
import { selectPeers, selectTracksMap, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { PipIcon } from '@100mslive/react-icons';
import { Flex, Tooltip } from '../../../';
import IconButton from '../../IconButton';
import { PictureInPicture } from './PIPManager';
import { MediaSession } from './SetupMediaSession';
import { usePinnedTrack } from '../AppData/useUISettings';

/**
 * shows a button which when clicked shows some videos in PIP, clicking
 * again turns it off.
 */
const PIPComponent = ({ content = null }) => {
  const [isPipOn, setIsPipOn] = useState(PictureInPicture.isOn());
  const hmsActions = useHMSActions();
  const store = useHMSVanillaStore();

  const onPipToggle = useCallback(() => {
    if (!isPipOn) {
      PictureInPicture.start(hmsActions, setIsPipOn).catch(err => console.error('error in starting pip', err));
      MediaSession.setup(hmsActions, store);
    } else {
      PictureInPicture.stop().catch(err => console.error('error in stopping pip', err));
    }
  }, [hmsActions, isPipOn, store]);

  if (!PictureInPicture.isSupported()) {
    return null;
  }
  return (
    <>
      {content ? (
        <Flex css={{ w: '100%' }} onClick={() => onPipToggle()} data-testid="pip_btn">
          {content}
        </Flex>
      ) : (
        <Tooltip title={`${isPipOn ? 'Deactivate' : 'Activate'} picture in picture view`}>
          <IconButton active={!isPipOn} key="pip" onClick={() => onPipToggle()} data-testid="pip_btn">
            <PipIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

/**
 * this is a separate component so it can be conditionally rendered and
 * the subscriptions to store are done only if required.
 */
export const ActivatedPIP = () => {
  const tracksMap = useHMSStore(selectTracksMap);
  const storePeers = useHMSStore(selectPeers);
  const pinnedTrack = usePinnedTrack();

  useEffect(() => {
    function updatePIP() {
      if (!PictureInPicture.isOn()) {
        return;
      }
      let pipPeers = storePeers;
      if (pinnedTrack) {
        pipPeers = storePeers.filter(peer => pinnedTrack.peerId === peer.id);
      }
      PictureInPicture.updatePeersAndTracks(pipPeers, tracksMap).catch(err => {
        console.error('error in updating pip', err);
      });
    }
    PictureInPicture.listenToStateChange(updatePIP);
    updatePIP();
  }, [storePeers, tracksMap, pinnedTrack]);

  return <></>;
};

export default PIPComponent;
