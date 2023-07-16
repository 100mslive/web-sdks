import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HMSRoomProvider, selectIsConnectedToRoom, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { AppData } from './components/AppData/AppData';
import { BeamSpeakerLabelsLogging } from './components/AudioLevel/BeamSpeakerLabelsLogging';
import AuthToken from './components/AuthToken';
import { ErrorBoundary } from './components/ErrorBoundary';
import ErrorPage from './components/ErrorPage';
import FullPageProgress from './components/FullPageProgress';
import { Init } from './components/init/Init';
import { KeyboardHandler } from './components/Input/KeyboardInputManager';
import { Notifications } from './components/Notifications';
import PostLeave from './components/PostLeave';
import PreviewContainer from './components/Preview/PreviewContainer';
import { ToastContainer } from './components/Toast/ToastContainer';
import { Box, HMSThemeProvider } from '../';
import { HMSPrebuiltContext, useHMSPrebuiltContext } from './AppContext';
import { hmsActions, hmsNotifications, hmsStats, hmsStore } from './hms.js';
import { Confetti } from './plugins/confetti';
import { FlyingEmoji } from './plugins/FlyingEmoji';
import { RemoteStopScreenshare } from './plugins/RemoteStopScreenshare';
import { getRoutePrefix, shadeColor } from './common/utils';
import { FeatureFlags } from './services/FeatureFlags';

const Conference = React.lazy(() => import('./components/conference'));

const defaultTokenEndpoint = process.env.REACT_APP_TOKEN_GENERATION_ENDPOINT;
const isSSR = typeof window === 'undefined';

let appName;
if (!isSSR) {
  if (window.location.host.includes('localhost')) {
    appName = 'localhost';
  } else {
    appName = window.location.host.split('.')[0];
  }
  document.title = `${appName}'s ${document.title}`;
}

// TODO: remove now that there are options to change to portrait
const getAspectRatio = ({ width, height }) => {
  const host = process.env.REACT_APP_HOST_NAME;
  const portraitDomains = (process.env.REACT_APP_PORTRAIT_MODE_DOMAINS || '').split(',');
  if (portraitDomains.includes(host) && width > height) {
    return { width: height, height: width };
  }
  return { width, height };
};

export const HMSPrebuilt = React.forwardRef(
  (
    {
      themeConfig: {
        aspectRatio = '1-1',
        font = 'Roboto',
        color = '#2F80FF',
        theme = 'dark',
        logo = '',
        metadata = '',
        recordingUrl = '',
      } = {},
      roomId = '',
      role = '',
      roomCode = '',
      options: {
        userName = '',
        userId = '',
        endPoints: { init: initEndpoint = '', tokenByRoomCode = '', tokenByRoomIdRole = defaultTokenEndpoint } = {},
      } = {},
      onLeave,
    },
    ref,
  ) => {
    const { 0: width, 1: height } = aspectRatio.split('-').map(el => parseInt(el));

    const [hyderated, setHyderated] = React.useState(false);
    useEffect(() => setHyderated(true), []);
    useEffect(() => {
      if (!ref) {
        return;
      }
      ref.current = {
        hmsActions,
        hmsStats,
        hmsStore,
        hmsNotifications,
      };
    }, [ref]);

    const endPoints = {
      tokenByRoomCode,
      init: initEndpoint,
      tokenByRoomIdRole,
    };

    if (!hyderated) {
      return null;
    }
    return (
      <ErrorBoundary>
        <HMSPrebuiltContext.Provider
          value={{
            roomId,
            role,
            roomCode,
            showPreview: true,
            showLeave: true,
            onLeave,
            userName,
            userId,
            endPoints,
          }}
        >
          <HMSThemeProvider
            themeType={theme}
            aspectRatio={getAspectRatio({ width, height })}
            theme={{
              colors: {
                brandDefault: color,
                brandDark: shadeColor(color, -30),
                brandLight: shadeColor(color, 30),
                brandDisabled: shadeColor(color, 10),
              },
              fonts: {
                sans: [font, 'Inter', 'sans-serif'],
              },
            }}
          >
            <HMSRoomProvider
              isHMSStatsOn={FeatureFlags.enableStatsForNerds}
              actions={hmsActions}
              store={hmsStore}
              notifications={hmsNotifications}
              stats={hmsStats}
            >
              <AppData
                appDetails={metadata}
                recordingUrl={recordingUrl}
                logo={logo}
                tokenEndpoint={endPoints.tokenByRoomIdRole}
              />
              <Init />
              <Box
                css={{
                  bg: '$mainBg',
                  size: '100%',
                }}
              >
                <AppRoutes authTokenByRoomCodeEndpoint={endPoints.tokenByRoomCode} />
              </Box>
            </HMSRoomProvider>
          </HMSThemeProvider>
        </HMSPrebuiltContext.Provider>
      </ErrorBoundary>
    );
  },
);

HMSPrebuilt.displayName = 'HMSPrebuilt';

const Redirector = ({ showPreview }) => {
  const { roomId, role } = useParams();

  if (!roomId && !role) {
    return <Navigate to="/" />;
  }
  if (!roomId) {
    return <Navigate to="/" />;
  }
  if (['streaming', 'preview', 'meeting', 'leave'].includes(roomId) && !role) {
    return <Navigate to="/" />;
  }

  return <Navigate to={`${getRoutePrefix()}/${showPreview ? 'preview' : 'meeting'}/${roomId}/${role || ''}`} />;
};

const RouteList = () => {
  const { showPreview, showLeave } = useHMSPrebuiltContext();

  return (
    <Routes>
      {showPreview && (
        <Route path="preview">
          <Route
            path=":roomId/:role"
            element={
              <Suspense fallback={<FullPageProgress />}>
                <PreviewContainer />
              </Suspense>
            }
          />
          <Route
            path=":roomId"
            element={
              <Suspense fallback={<FullPageProgress />}>
                <PreviewContainer />
              </Suspense>
            }
          />
        </Route>
      )}
      <Route path="meeting">
        <Route
          path=":roomId/:role"
          element={
            <Suspense fallback={<FullPageProgress />}>
              <Conference />
            </Suspense>
          }
        />
        <Route
          path=":roomId"
          element={
            <Suspense fallback={<FullPageProgress />}>
              <Conference />
            </Suspense>
          }
        />
      </Route>
      {showLeave && (
        <Route path="leave">
          <Route path=":roomId/:role" element={<PostLeave />} />
          <Route path=":roomId" element={<PostLeave />} />
        </Route>
      )}
      <Route path="/:roomId/:role" element={<Redirector showPreview={showPreview} />} />
      <Route path="/:roomId/" element={<Redirector showPreview={showPreview} />} />
      <Route path="*" element={<ErrorPage error="Invalid URL!" />} />
    </Routes>
  );
};

const BackSwipe = () => {
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  useEffect(() => {
    const onRouteLeave = async () => {
      if (isConnectedToRoom) {
        await hmsActions.leave();
      }
    };
    window.addEventListener('popstate', onRouteLeave);
    return () => {
      window.removeEventListener('popstate', onRouteLeave);
    };
  }, [hmsActions, isConnectedToRoom]);
  return null;
};

const Router = ({ children }) => {
  const { roomId, role, roomCode } = useHMSPrebuiltContext();
  return [roomId, role, roomCode].every(value => !value) ? (
    <BrowserRouter>{children}</BrowserRouter>
  ) : (
    <MemoryRouter initialEntries={[`/${roomCode ? roomCode : `${roomId}/${role || ''}`}`]} initialIndex={0}>
      {children}
    </MemoryRouter>
  );
};

function AppRoutes({ authTokenByRoomCodeEndpoint }) {
  return (
    <Router>
      <ToastContainer />
      <Notifications />
      <BackSwipe />
      <Confetti />
      <FlyingEmoji />
      <RemoteStopScreenshare />
      <KeyboardHandler />
      <BeamSpeakerLabelsLogging />
      <AuthToken authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint} />
      <Routes>
        <Route path="/*" element={<RouteList />} />
        <Route path="/streaming/*" element={<RouteList />} />
      </Routes>
    </Router>
  );
}
