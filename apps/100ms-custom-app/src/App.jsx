import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Flex, HMSPrebuilt } from '@100mslive/roomkit-react';
import { useOverridePrebuiltLayout } from './hooks/useOverridePrebuiltLayout';
import { useSearchParam } from './hooks/useSearchParam';
import {
  apiBasePath,
  getAuthInfo,
  getAuthTokenUsingRoomIdRole,
  getRoomCodeFromUrl,
  getRoomIdRoleFromUrl,
  getWithRetry,
} from './utils/utils';

let hostname = window.location.hostname;
if (!hostname.endsWith('app.100ms.live')) {
  hostname = process.env.REACT_APP_HOST_NAME || hostname;
} else if (hostname.endsWith('dev-app.100ms.live')) {
  // route dev-app appropriately to qa or prod
  const envSuffix =
    process.env.REACT_APP_ENV === 'prod'
      ? 'app.100ms.live'
      : 'qa-app.100ms.live';
  hostname = hostname.replace('dev-app.100ms.live', envSuffix);
} else if (hostname.endsWith('staging-app.100ms.live')) {
  // route staging-app appropriately to qa or prod
  const envSuffix =
    process.env.REACT_APP_ENV === 'prod'
      ? 'app.100ms.live'
      : 'qa-app.100ms.live';
  hostname = hostname.replace('staging-app.100ms.live', envSuffix);
} else if (
  hostname.endsWith('qa-app.100ms.live') &&
  process.env.REACT_APP_ENV === 'prod'
) {
  hostname = hostname.replace('qa-app.100ms.live', 'app.100ms.live');
}

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
  const { overrideLayout, isHeadless } = useOverridePrebuiltLayout();
  const hmsPrebuiltRef = useRef();

  useEffect(() => {
    if (roomCode) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    // remove notifications and messages for beam
    // enable beam speaker logging for transcription
    if ((authToken || roomCode) && hmsPrebuiltRef.current && isHeadless) {
      const { hmsActions } = hmsPrebuiltRef.current;
      hmsActions?.enableBeamSpeakerLabelsLogging?.();
      hmsActions?.ignoreMessageTypes?.(['chat', 'EMOJI_REACTION']);
      hmsActions?.setAppData?.('disableNotificiations', true);
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

  const fetchData = async () => {
    const jwt = getAuthInfo().token;

    const url = `${apiBasePath}apps/get-details?domain=${hostname}&room_id=${roomCode}`;
    const headers = {};
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }
    headers['Content-Type'] = 'application/json';

    getWithRetry(url, headers)
      .then(res => {
        if (res.data.success) {
          setOnlyEmail(res.data.same_user);
          setShowHeader(true);
          setData({
            roomLinks: res.data.room_link,
            policyID: res.data.policy_id,
            theme: res.data.theme,
          });
        }
      })
      .catch(err => {
        setShowHeader(false);
        const errorMessage = `[Get Details] ${err.message}`;
        let error = {
          title: 'Something went wrong',
          body: errorMessage,
        };
        if (err.response && err.response.status === 404) {
          error = {
            title: 'Link is invalid',
            body:
              err.response.data?.msg || 'Please make sure that link is valid.',
          };
        }
        console.error(errorMessage);
      });
  };

  return (
    <Flex
      className="prebuilt-wrapper"
      direction="column"
      css={{ size: '100%', overflowY: 'hidden', bg: '$background_dim' }}
    >
      {onlyEmail && showHeader && (
        <Suspense fallback={null}>
          <Header
            roomLinks={data?.roomLinks}
            onlyEmail={onlyEmail}
            policyID={data?.policyID}
            theme={data?.theme}
          />
        </Suspense>
      )}
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
