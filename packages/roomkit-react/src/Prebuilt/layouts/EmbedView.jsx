import React, { useEffect, useMemo } from 'react';
import { selectAppData, selectPeers, selectPeerScreenSharing, useEmbedShare, useHMSStore } from '@100mslive/react-sdk';
import { SecondaryTiles } from '../components/SecondaryTiles';
import { ToastManager } from '../components/Toast/ToastManager';
import { ProminenceLayout } from '../components/VideoLayouts/ProminenceLayout';
import { Box } from '../../Layout';
import { useResetEmbedConfig, useSetAppDataByKey } from '../components/AppData/useUISettings';
import { APP_DATA } from '../common/constants';

export const EmbedView = () => {
  return (
    <EmbedScreenShareView>
      <EmbedComponent />
    </EmbedScreenShareView>
  );
};

export const EmbedScreenShareView = ({ children }) => {
  const peers = useHMSStore(selectPeers);

  const peerPresenting = useHMSStore(selectPeerScreenSharing);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);

  const smallTilePeers = useMemo(() => {
    const smallTilePeers = peers.filter(peer => peer.id !== peerPresenting?.id);
    return smallTilePeers;
  }, [peers, peerPresenting]);

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
/**
 * EmbedView is responsible for rendering the iframe and managing the screen sharing functionality.
 */
const EmbedComponent = () => {
  const embedConfig = useHMSStore(selectAppData(APP_DATA.embedConfig));
  const resetConfig = useResetEmbedConfig();

  // need to send resetConfig to clear configuration, if stop screenshare occurs.
  const { iframeRef, startEmbedShare, isEmbedShareInProgress } = useEmbedShare(resetConfig);

  useEffect(() => {
    (async () => {
      if (embedConfig && !isEmbedShareInProgress) {
        try {
          await startEmbedShare(embedConfig);
        } catch (err) {
          resetConfig();
          ToastManager.addToast({
            title: `Error while sharing embed url ${err.message || ''}`,
            variant: 'error',
          });
        }
      }
    })();
  }, [isEmbedShareInProgress, embedConfig, startEmbedShare, resetConfig]);

  return (
    <Box
      css={{
        mx: '$8',
        flex: '3 1 0',
        '@lg': {
          flex: '2 1 0',
          display: 'flex',
          alignItems: 'center',
        },
      }}
    >
      <iframe
        title="Embed View"
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          borderRadius: '0.75rem',
        }}
        allow="autoplay; clipboard-write;"
        referrerPolicy="no-referrer"
      />
    </Box>
  );
};

// const EmbedComponent = () => {
//   const { amIScreenSharing, toggleScreenShare } = useScreenShare(throwErrorHandler);
//   const [embedConfig, setEmbedConfig] = useSetAppDataByKey(APP_DATA.embedConfig);
//   const [wasScreenShared, setWasScreenShared] = useState(false);
//   // to handle - https://github.com/facebook/react/issues/24502
//   const screenShareAttemptInProgress = useRef(false);
//   const src = embedConfig.url;
//   const iframeRef = useRef();

//   const resetEmbedConfig = useCallback(() => {
//     if (src) {
//       setEmbedConfig({ url: '' });
//     }
//   }, [src, setEmbedConfig]);

//   useEffect(() => {
//     if (embedConfig.shareScreen && !amIScreenSharing && !wasScreenShared && !screenShareAttemptInProgress.current) {
//       screenShareAttemptInProgress.current = true;
//       // start screenshare on load for others in the room to see
//       toggleScreenShare({
//         forceCurrentTab: true,
//         cropElement: iframeRef.current,
//       })
//         .then(() => {
//           setWasScreenShared(true);
//         })
//         .catch(resetEmbedConfig)
//         .finally(() => {
//           screenShareAttemptInProgress.current = false;
//         });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     // reset embed when screenshare is closed from anywhere
//     if (wasScreenShared && !amIScreenSharing) {
//       resetEmbedConfig();
//     }
//     return () => {
//       // close screenshare when this component is being unmounted
//       if (wasScreenShared && amIScreenSharing) {
//         resetEmbedConfig();
//         toggleScreenShare(); // stop
//       }
//     };
//   }, [wasScreenShared, amIScreenSharing, resetEmbedConfig, toggleScreenShare]);

//   return (
//     <Box ref={iframeRef} css={{ size: '100%' }}>
//       <iframe
//         src={src}
//         title={src}
//         style={{ width: '100%', height: '100%', border: 0 }}
//         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
//         referrerPolicy="no-referrer"
//       />
//     </Box>
//   );
// };
