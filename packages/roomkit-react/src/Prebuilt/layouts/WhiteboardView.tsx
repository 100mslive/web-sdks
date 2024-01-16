import React, { useEffect, useMemo } from 'react';
import { useMedia } from 'react-use';
import { selectPeers, selectWhiteboard, useHMSStore, useWhiteboard } from '@100mslive/react-sdk';
import { SecondaryTiles } from '../components/SecondaryTiles';
import { ProminenceLayout } from '../components/VideoLayouts/ProminenceLayout';
import { config as cssConfig } from '../../';
import { Box } from '../../Layout';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../components/AppData/useUISettings';
import { APP_DATA } from '../common/constants';

const EmbedComponent = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const { iframeRef } = useWhiteboard(isMobile);

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
        title="Whiteboard View"
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

export const WhiteboardView = () => {
  const peers = useHMSStore(selectPeers);
  const whiteboard = useHMSStore(selectWhiteboard);
  const [, setActiveScreenSharePeer] = useSetAppDataByKey(APP_DATA.activeScreensharePeerId);

  const smallTilePeers = useMemo(() => {
    const smallTilePeers = peers.filter(peer => peer.id !== whiteboard?.owner);
    return smallTilePeers;
  }, [peers, whiteboard?.owner]);

  useEffect(() => {
    setActiveScreenSharePeer(whiteboard?.owner || '');
    return () => {
      setActiveScreenSharePeer('');
    };
  }, [whiteboard?.owner, setActiveScreenSharePeer]);

  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <EmbedComponent />
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles peers={smallTilePeers} />
    </ProminenceLayout.Root>
  );
};
