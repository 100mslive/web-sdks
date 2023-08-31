import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectPeers,
  selectPeerScreenSharing,
  throwErrorHandler,
  useHMSStore,
  useScreenShare,
} from '@100mslive/react-sdk';
import { SecondaryTiles } from '../components/SecondaryTiles';
import { ProminenceLayout } from '../components/VideoLayouts/ProminenceLayout';
import { Box } from '../../Layout';
import { useSetAppDataByKey } from '../components/AppData/useUISettings';
import { APP_DATA } from '../common/constants';

export const EmbedView = () => {
  return (
    <EmbebScreenShareView>
      <EmbedComponent />
    </EmbebScreenShareView>
  );
};

export const EmbebScreenShareView = ({ children }) => {
  const peers = useHMSStore(selectPeers);

  const localPeerID = useHMSStore(selectLocalPeerID);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const peerPresenting = useHMSStore(selectPeerScreenSharing);
  const isPresenterFromMyRole = peerPresenting?.roleName?.toLowerCase() === localPeerRole?.toLowerCase();
  const amIPresenting = localPeerID === peerPresenting?.id;
  const showPresenterInSmallTile = amIPresenting || isPresenterFromMyRole;
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);

  const smallTilePeers = useMemo(() => {
    const smallTilePeers = peers.filter(peer => peer.id !== peerPresenting?.id);
    if (showPresenterInSmallTile && peerPresenting) {
      smallTilePeers.unshift(peerPresenting); // put presenter on first page
    }
    return smallTilePeers;
  }, [peers, peerPresenting, showPresenterInSmallTile]);

  useEffect(() => {
    setActiveScreenSharePeer(peerPresenting?.id);
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [peerPresenting?.id, setActiveScreenSharePeer]);
  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>{children}</ProminenceLayout.ProminentSection>
      <SecondaryTiles peers={smallTilePeers} />
    </ProminenceLayout.Root>
  );
};

const EmbedComponent = () => {
  const { amIScreenSharing, toggleScreenShare } = useScreenShare(throwErrorHandler);
  const [embedConfig, setEmbedConfig] = useSetAppDataByKey(APP_DATA.embedConfig);
  const [wasScreenShared, setWasScreenShared] = useState(false);
  // to handle - https://github.com/facebook/react/issues/24502
  const screenShareAttemptInProgress = useRef(false);
  const src = embedConfig.url;
  const iframeRef = useRef();

  const resetEmbedConfig = useCallback(() => {
    if (src) {
      setEmbedConfig({ url: '' });
    }
  }, [src, setEmbedConfig]);

  useEffect(() => {
    if (embedConfig.shareScreen && !amIScreenSharing && !wasScreenShared && !screenShareAttemptInProgress.current) {
      screenShareAttemptInProgress.current = true;
      // start screenshare on load for others in the room to see
      toggleScreenShare({
        forceCurrentTab: true,
        cropElement: iframeRef.current,
      })
        .then(() => {
          setWasScreenShared(true);
        })
        .catch(resetEmbedConfig)
        .finally(() => {
          screenShareAttemptInProgress.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reset embed when screenshare is closed from anywhere
    if (wasScreenShared && !amIScreenSharing) {
      resetEmbedConfig();
    }
    return () => {
      // close screenshare when this component is being unmounted
      if (wasScreenShared && amIScreenSharing) {
        resetEmbedConfig();
        toggleScreenShare(); // stop
      }
    };
  }, [wasScreenShared, amIScreenSharing, resetEmbedConfig, toggleScreenShare]);

  return (
    <Box ref={iframeRef} css={{ size: '100%' }}>
      <iframe
        src={src}
        title={src}
        style={{ width: '100%', height: '100%', border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
        referrerPolicy="no-referrer"
      />
    </Box>
  );
};
