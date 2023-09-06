import React, { useEffect, useRef, useState } from 'react';
import { Flex, HMSPrebuilt } from '@100mslive/roomkit-react';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { useSearchParam } from './hooks/useSearchParam';
import {
  getAuthTokenUsingRoomIdRole,
  getRoomCodeFromUrl,
  getRoomIdRoleFromUrl,
} from './utils/utils';

const App = () => {
  const roomCode = getRoomCodeFromUrl();
  const [authToken, setAuthToken] = useState(useSearchParam('auth_token'));
  // added subdomain in query param for easy testing in vercel links
  const subdomain = useSearchParam('subdomain') || window.location.hostname;
  const { roomId, role } = getRoomIdRoleFromUrl();
  const { overrideLayout, isHeadless } = useOverridePrebuiltLayout();
  const hmsPrebuiltRef = useRef();

  useEffect(() => {
    // remove notifications and messages for beam
    // enable beam speaker logging for transcription
    if ((authToken || roomCode) && hmsPrebuiltRef.current && isHeadless) {
      const { hmsActions } = hmsPrebuiltRef.current;
      hmsActions.enableBeamSpeakerLabelsLogging?.();
      hmsActions.ignoreMessageTypes?.(['chat', 'EMOJI_REACTION']);
      hmsActions.setAppData?.('notificationsDisabled', true);
    }
  }, [authToken, roomCode, isHeadless]);

  useEffect(() => {
    if (!roomCode && !authToken) {
      (async function getAuthToken() {
        const token = await getAuthTokenUsingRoomIdRole({
          subdomain,
          roomId,
          role,
          userId: 'beam',
        });
        setAuthToken(token);
      })();
    }
  }, [authToken, role, roomCode, roomId, subdomain]);

  return (
    <Flex
      className="prebuilt-wrapper"
      direction="column"
      css={{ size: '100%', overflowY: 'hidden', bg: '$background_dim' }}
    >
      {(authToken || roomCode) && (
        <HMSPrebuilt
          roomCode={roomCode}
          authToken={authToken}
          roomId={roomId}
          role={role}
          screens={overrideLayout ? overrideLayout : undefined}
          options={{
            userName: isHeadless ? 'Beam' : undefined,
            endpoints: {
              tokenByRoomCode:
                process.env.REACT_APP_TOKEN_BY_ROOM_CODE_ENDPOINT,
              roomLayout: process.env.REACT_APP_ROOM_LAYOUT_ENDPOINT,
              init: process.env.REACT_APP_INIT_ENDPOINT,
            },
          }}
          ref={hmsPrebuiltRef}
        />
      )}
    </Flex>
  );
};

export default App;
