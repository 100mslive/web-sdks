import React from 'react';
import { Flex, HMSPrebuilt } from '@100mslive/roomkit-react';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { getRoomCodeFromUrl } from './utils/utils';

const App = () => {
  const roomCode = getRoomCodeFromUrl();
  const overrideLayout = useOverridePrebuiltLayout();
  return (
    <Flex
      direction="column"
      css={{ size: '100%', overflowY: 'hidden', bg: '$background_dim' }}
    >
      <HMSPrebuilt
        roomCode={roomCode}
        screens={overrideLayout ? overrideLayout : undefined}
        options={{
          endpoints: {
            tokenByRoomCode: process.env.REACT_APP_TOKEN_BY_ROOM_CODE_ENDPOINT,
            roomLayout: process.env.REACT_APP_ROOM_LAYOUT_ENDPOINT,
            init: process.env.REACT_APP_INIT_ENDPOINT,
          },
        }}
      />
    </Flex>
  );
};

export default App;
