import React, { useCallback, useEffect, useState } from 'react';
import { selectPeers, selectTracksMap, useHMSActions, useHMSVanillaStore } from '@100mslive/react-sdk';
import { PipIcon } from '@100mslive/react-icons';
import { Flex, Tooltip } from '../../..';
import IconButton from '../../IconButton';
import { PictureInPicture } from './PIPManager';
// @ts-ignore: No implicit Any
import { MediaSession } from './SetupMediaSession';
// @ts-ignore: No implicit Any
import { usePinnedTrack, useSpotlightPeerIds } from '../AppData/useUISettings';

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
  const store = useHMSVanillaStore();
  const pinnedTrack = usePinnedTrack();
  const spotlightPeerIds = useSpotlightPeerIds() as string[] | undefined;

  useEffect(() => {
    function subscribeToStore() {
      return store.subscribe(tracksMap => {
        let pipPeers = store.getState(selectPeers);
        if (pinnedTrack) {
          pipPeers = pipPeers.filter(peer => pinnedTrack.peerId === peer.id);
        } else if (spotlightPeerIds?.length) {
          pipPeers = pipPeers.filter(peer => spotlightPeerIds.includes(peer.id));
        }
        PictureInPicture.updatePeersAndTracks(pipPeers, tracksMap).catch(err => {
          console.error('error in updating pip', err);
        });
      }, selectTracksMap);
    }
    let unsubscribe: (() => void) | undefined = PictureInPicture.isOn() ? subscribeToStore() : undefined;
    PictureInPicture.listenToStateChange(isOn => {
      if (isOn) {
        if (!unsubscribe) {
          unsubscribe = subscribeToStore();
        }
      } else {
        unsubscribe?.();
        unsubscribe = undefined;
      }
    });
    return () => {
      unsubscribe?.();
      unsubscribe = undefined;
    };
  }, [pinnedTrack, store]);

  return <></>;
};

export default PIPComponent;
