import React from 'react';
import { Flex, HMSPrebuilt } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl, getRoomLayout } from './utils/utils';

const App = () => {
  const roomCode = getRoomCodeFromUrl();
  const roomLayout = getRoomLayout(process.env.REACT_APP_ROOM_LAYOUT_ENDPOINT);
  console.log('room layout ', roomLayout);
  return (
    <Flex
      direction="column"
      css={{ size: '100%', overflowY: 'hidden', bg: '$background_dim' }}
    >
      <HMSPrebuilt
        roomCode={roomCode}
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
