import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Flex } from '@100mslive/roomkit-react';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { useSearchParam } from './hooks/useSearchParam';
import {
  fetchData,
  getAuthTokenUsingRoomIdRole,
  getRoomCodeFromUrl,
  getRoomIdRoleFromUrl,
} from './utils/utils';

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
      <iframe
        title="100ms-app"
        allow="camera *;microphone *;display-capture *"
        src=""
        style={{ height: '100vh', width: '100%', border: 0 }}
      ></iframe>
    </Flex>
  );
};

export default App;
