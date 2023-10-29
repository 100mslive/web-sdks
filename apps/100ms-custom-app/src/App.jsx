import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Flex } from '@100mslive/roomkit-react';
import * as Test from '../../../packages/roomkit-web-component/dist/index.cjs.js';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { useSearchParam } from './hooks/useSearchParam';
import {
  fetchData,
  getAuthTokenUsingRoomIdRole,
  getRoomCodeFromUrl,
  getRoomIdRoleFromUrl,
} from './utils/utils';

console.log(Test);
window.log = () => console.log('ollo');

const Header = React.lazy(() => import('./components/Header'));

const App = () => {
  const roomCode = getRoomCodeFromUrl();
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [authToken, setAuthToken] = useState(useSearchParam('auth_token'));
  const [data, setData] = useState({});
  const [showHeader, setShowHeader] = useState(false);
  // added subdomain in query param for easy testing in vercel links
  const subdomain = useSearchParam('subdomain') || window.location.hostname;
  const { roomId, role } = getRoomIdRoleFromUrl();
  const { isHeadless } = useOverridePrebuiltLayout();
  const hmsPrebuiltRef = useRef();

  useEffect(() => {
    if (roomCode) {
      fetchData(subdomain, roomCode, setOnlyEmail, setData, setShowHeader);
    }
  }, []);

  useEffect(() => {
    // remove notifications and messages for beam
    // enable beam speaker logging for transcription
    if ((authToken || roomCode) && hmsPrebuiltRef.current && isHeadless) {
      const { hmsActions } = hmsPrebuiltRef.current;
      hmsActions?.enableBeamSpeakerLabelsLogging?.();
      hmsActions?.ignoreMessageTypes?.(['chat', 'EMOJI_REACTION']);
      hmsActions?.setAppData?.('disableNotifications', true);
    }
    const hmsPrebuiltElement = document.querySelector('hms-prebuilt');
    // Access the 'room-code' prop
    const roomCodeProp = hmsPrebuiltElement?.getAttribute('room-code');
    console.log('room-code: ollo ', roomCodeProp);
    // Access the 'on-leave' prop
    const onLeaveProp = hmsPrebuiltElement?.getAttribute('on-leave');
    console.log('on-leave: ollo ', onLeaveProp);
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
      css={{
        size: '100%',
        overflowY: 'hidden',
        bg: '$background_dim',
      }}
    >
      {onlyEmail && showHeader && (
        <Suspense fallback={null}>
          <Header
            roomLinks={data?.roomLinks}
            policyID={data?.policyID}
            theme={data?.theme}
          />
        </Suspense>
      )}
      {(authToken || roomCode) && (
        <div style={{ height: '100%' }}>
          <hms-prebuilt room-code="fba-xji-pnk" on-leave="log"></hms-prebuilt>
        </div>

        // authToken={authToken}
        // roomId={roomId}
        // role={role}
        // screens={overrideLayout ? overrideLayout : undefined}
        // options={{
        //   userName: isHeadless ? 'Beam' : undefined,
        //   endpoints: {
        //     tokenByRoomCode:
        //       process.env.REACT_APP_TOKEN_BY_ROOM_CODE_ENDPOINT,
        //     roomLayout: process.env.REACT_APP_ROOM_LAYOUT_ENDPOINT,
        //     init: process.env.REACT_APP_INIT_ENDPOINT,
        //   },
        // }}
        // ref={hmsPrebuiltRef}
      )}
    </Flex>
  );
};

export default App;
