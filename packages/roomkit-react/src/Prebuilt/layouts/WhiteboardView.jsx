import React from 'react';
import { selectPeers, selectRoomID, useHMSStore } from '@100mslive/react-sdk';
import { SecondaryTiles } from '../components/SecondaryTiles';
import { ProminenceLayout } from '../components/VideoLayouts/ProminenceLayout';
import { Box } from '../../Layout';
// import { Whiteboard } from '../plugins/whiteboard';

const Editor = React.memo(() => {
  return (
    <Box
      css={{
        mx: '$4',
        flex: '3 1 0',
        '@lg': {
          flex: '2 1 0',
          '& video': {
            objectFit: 'contain',
          },
        },
      }}
    >
      <Box css={{ position: 'relative', width: '100%', height: '100%' }}>{/* <Whiteboard roomId={roomId} /> */}</Box>
    </Box>
  );
});

const WhiteboardView = () => {
  const peers = useHMSStore(selectPeers);
  const roomId = useHMSStore(selectRoomID);
  return (
    <ProminenceLayout.Root>
      <ProminenceLayout.ProminentSection>
        <Editor roomId={roomId} />
      </ProminenceLayout.ProminentSection>
      <SecondaryTiles peers={peers} />
    </ProminenceLayout.Root>
  );
};

export default WhiteboardView;
