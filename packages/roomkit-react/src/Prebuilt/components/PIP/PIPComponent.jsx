import React, { useCallback, useEffect, useState } from 'react';
import {
  selectLocalPeerRoleName,
  selectPeers,
  selectTracksMap,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { PipIcon } from '@100mslive/react-icons';
import { Flex, Tooltip } from '../../../';
import IconButton from '../../IconButton';
import { PictureInPicture } from './PIPManager';
import { MediaSession } from './SetupMediaSession';
import { usePinnedTrack } from '../AppData/useUISettings';
import { DEFAULT_HLS_VIEWER_ROLE } from '../../common/constants';

/**
 * shows a button which when clicked shows some videos in PIP, clicking
 * again turns it off.
 */
const PIPComponent = ({ content = null }) => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
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

  if (!PictureInPicture.isSupported() || localPeerRole === DEFAULT_HLS_VIEWER_ROLE) {
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
  const vanillaStore = useHMSVanillaStore();
  const pinnedTrack = usePinnedTrack();

  useEffect(() => {
    let unsubscribe;
    PictureInPicture.listenToStateChange(isPipOn => {
      if (!isPipOn) {
        return;
      }
      unsubscribe = vanillaStore.subscribe(storePeers => {
        const tracksMap = vanillaStore.getState(selectTracksMap);
        let pipPeers = storePeers;
        if (pinnedTrack) {
          pipPeers = storePeers.filter(peer => pinnedTrack.peerId === peer.id);
        }
        console.log({ storePeers });
        PictureInPicture.updatePeersAndTracks(pipPeers, tracksMap).catch(err => {
          console.error('error in updating pip', err);
        });
      }, selectPeers);
    });
    return () => unsubscribe?.();
  }, [vanillaStore, pinnedTrack]);

  return <></>;
};

export default PIPComponent;
