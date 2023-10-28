import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Flex } from '@100mslive/roomkit-react';
import * as Test from '../../../packages/roomkit-web/dist/index.cjs';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { useSearchParam } from './hooks/useSearchParam';
import {
  fetchData,
  getAuthTokenUsingRoomIdRole,
  getRoomCodeFromUrl,
  getRoomIdRoleFromUrl,
} from './utils/utils';

console.log(Test);
const Header = React.lazy(() => import('./components/Header'));

const userName = JSON.stringify({ userName: 'test222' });
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
          <hms-prebuilt
            auth-token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoyLCJ0eXBlIjoiYXBwIiwiYXBwX2RhdGEiOm51bGwsImFjY2Vzc19rZXkiOiI2MGNiMTIwN2E1Mjc0YmM2ZjFhM2M1YWUiLCJyb2xlIjoic3R1ZGVudCIsInJvb21faWQiOiI2MGNiMTIyNDRhN2I2N2I2OWYzNjdiMmYiLCJleHAiOjE2OTg1NjY4ODksImp0aSI6Ijg3NWU4NmY5LWM3NmUtNGQzOS1iYmFmLWM2Y2RiZjVhZTk1MiIsImlhdCI6MTY5ODQ4MDQ4OSwiaXNzIjoiNjBjYjEyMDdhNTI3NGJjNmYxYTNjNWFiIiwibmJmIjoxNjk4NDgwNDg5LCJzdWIiOiJhcGkifQ.ikGjYfK8cqKWCzQvGsqVrq1S4s2pgc7qb0aKtAK0uZU"
            room-id="60cb12244a7b67b69f367b2f"
            role="student"
            options={userName}
          ></hms-prebuilt>
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
