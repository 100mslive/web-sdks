import React, { MutableRefObject, ReactElement, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Logo, Screens, Theme, Typography } from '@100mslive/types-prebuilt';
import {
  HMSActions,
  HMSReactiveStore,
  HMSRoomProvider,
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { AppData } from './components/AppData/AppData';
// @ts-ignore: No implicit Any
import { BeamSpeakerLabelsLogging } from './components/AudioLevel/BeamSpeakerLabelsLogging';
// @ts-ignore: No implicit Any
import AuthToken from './components/AuthToken';
// @ts-ignore: No implicit Any
import { ErrorBoundary } from './components/ErrorBoundary';
// @ts-ignore: No implicit Any
import FullPageProgress from './components/FullPageProgress';
// @ts-ignore: No implicit Any
import { Init } from './components/init/Init';
// @ts-ignore: No implicit Any
import { KeyboardHandler } from './components/Input/KeyboardInputManager';
// @ts-ignore: No implicit Any
import { Notifications } from './components/Notifications';
// @ts-ignore: No implicit Any
import PostLeave from './components/PostLeave';
// @ts-ignore: No implicit Any
import PreviewContainer from './components/Preview/PreviewContainer';
// @ts-ignore: No implicit Any
import { ToastContainer } from './components/Toast/ToastContainer';
import { RoomLayoutContext, RoomLayoutProvider } from './provider/roomLayoutProvider';
import { Box } from '../Layout';
import { globalStyles, HMSThemeProvider } from '../Theme';
// @ts-ignore: No implicit Any
import { HMSPrebuiltContext, useHMSPrebuiltContext } from './AppContext';
// @ts-ignore: No implicit Any
import { FlyingEmoji } from './plugins/FlyingEmoji';
// @ts-ignore: No implicit Any
import { RemoteStopScreenshare } from './plugins/RemoteStopScreenshare';
// @ts-ignore: No implicit Any
import { getRoutePrefix } from './common/utils';
// @ts-ignore: No implicit Any
import { FeatureFlags } from './services/FeatureFlags';

// @ts-ignore: No implicit Any
const Conference = React.lazy(() => import('./components/conference'));

type HMSPrebuiltOptions = {
  userName?: string;
  userId?: string;
  endpoints?: {
    init?: string;
    tokenByRoomCode?: string;
    tokenByRoomIdRole?: string;
    roomLayout?: string;
  };
};

type HMSPrebuiltProps = {
  roomCode?: string;
  logo?: Logo;
  typography?: Typography;
  themes?: Theme[];
  options?: HMSPrebuiltOptions;
  screens?: Screens;
  onLeave: () => void;
};

type HMSPrebuiltRefType = MutableRefObject<{
  hmsActions: HMSActions;
}>;

// TODO: remove now that there are options to change to portrait
const getAspectRatio = ({ width, height }: { width: string; height: string }) => {
  const host = process.env.REACT_APP_HOST_NAME || '';
  const portraitDomains = (process.env.REACT_APP_PORTRAIT_MODE_DOMAINS || '').split(',');
  if (portraitDomains.includes(host) && width > height) {
    return { width: height, height: width };
  }
  return { width, height };
};

export const HMSPrebuilt = React.forwardRef<HMSPrebuiltRefType, HMSPrebuiltProps>(
  (
    {
      roomCode = '',
      logo,
      typography,
      themes,
      options: {
        userName = '',
        userId = '',
        endpoints: {
          init: initEndpoint = '',
          tokenByRoomCode: tokenByRoomCodeEndpoint = '',
          tokenByRoomIdRole: tokenByRoomIdRoleEndpoint = '',
          roomLayout: roomLayoutEndpoint = '',
        } = {},
      } = {},
      screens,
      onLeave,
    },
    ref,
  ) => {
    const aspectRatio = '1-1';
    const metadata = '';
    const { 0: width, 1: height } = aspectRatio.split('-').map(el => parseInt(el));
    const reactiveStore = useRef() as HMSPrebuiltRefType;

    const [hydrated, setHydrated] = React.useState(false);
    useEffect(() => {
      setHydrated(true);
      const hms = new HMSReactiveStore();
      const hmsStore = hms.getStore();
      const hmsActions = hms.getActions();
      const hmsNotifications = hms.getNotifications();
      const hmsStats = hms.getStats();

      reactiveStore.current = {
        hmsActions,
        hmsStats,
        hmsStore,
        hmsNotifications,
      };
    }, []);

    useEffect(() => {
      if (!ref || !reactiveStore.current) {
        return;
      }

      ref.current = { ...reactiveStore.current };
    }, [ref]);

    // leave room when component unmounts
    useEffect(
      () => () => {
        return reactiveStore.current.hmsActions.leave();
      },
      [],
    );

    const endpoints = {
      tokenByRoomCode: tokenByRoomCodeEndpoint,
      init: initEndpoint,
      tokenByRoomIdRole: tokenByRoomIdRoleEndpoint,
      roomLayout: roomLayoutEndpoint,
    };

    const overrideLayout = {
      logo,
      themes,
      typography,
      screens,
    };

    if (!hydrated) {
      return null;
    }

    globalStyles();

    return (
      <ErrorBoundary>
        <HMSPrebuiltContext.Provider
          value={{
            roomCode,
            showPreview: true,
            showLeave: true,
            onLeave,
            userName,
            userId,
            endpoints,
          }}
        >
          <HMSRoomProvider
            isHMSStatsOn={FeatureFlags.enableStatsForNerds}
            actions={reactiveStore.current.hmsActions}
            store={reactiveStore.current.hmsStore}
            notifications={reactiveStore.current.hmsNotifications}
            stats={reactiveStore.current.hmsStats}
          >
            <RoomLayoutProvider roomLayoutEndpoint={roomLayoutEndpoint} overrideLayout={overrideLayout}>
              <RoomLayoutContext.Consumer>
                {layout => {
                  const theme = layout.themes?.[0] || {};
                  const { typography } = layout;
                  let fontFamily = ['sans-serif'];
                  if (typography?.font_family) {
                    fontFamily = [`${typography?.font_family}`, ...fontFamily];
                  }

                  return (
                    <HMSThemeProvider
                      // issue is with stichtes caching the theme using the theme name / class
                      // no updates to the themes are fired if the name is same.
                      // TODO: cache the theme and do deep check to trigger name change in the theme
                      themeType={`${theme.name}-${Date.now()}`}
                      aspectRatio={getAspectRatio({ width, height })}
                      theme={{
                        colors: theme.palette,
                        fonts: {
                          sans: fontFamily,
                        },
                      }}
                    >
                      <AppData appDetails={metadata} tokenEndpoint={tokenByRoomIdRoleEndpoint} />
                      <Init />
                      <Box
                        css={{
                          bg: '$background_dim',
                          size: '100%',
                          lineHeight: '1.5',
                          '-webkit-text-size-adjust': '100%',
                        }}
                      >
                        <AppRoutes authTokenByRoomCodeEndpoint={tokenByRoomCodeEndpoint} />
                      </Box>
                    </HMSThemeProvider>
                  );
                }}
              </RoomLayoutContext.Consumer>
            </RoomLayoutProvider>
          </HMSRoomProvider>
        </HMSPrebuiltContext.Provider>
      </ErrorBoundary>
    );
  },
);

HMSPrebuilt.displayName = 'HMSPrebuilt';

const Redirector = ({ showPreview }: { showPreview: boolean }) => {
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
              <Suspense fallback={<FullPageProgress loadingText="Loading preview..." />}>
                <PreviewContainer />
              </Suspense>
            }
          />
          <Route
            path=":roomId"
            element={
              <Suspense fallback={<FullPageProgress loadingText="Loading preview..." />}>
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
            <Suspense fallback={<FullPageProgress loadingText="Joining..." />}>
              <Conference />
            </Suspense>
          }
        />
        <Route
          path=":roomId"
          element={
            <Suspense fallback={<FullPageProgress loadingText="Joining..." />}>
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

const Router = ({ children }: { children: ReactElement }) => {
  const { roomId, role, roomCode } = useHMSPrebuiltContext();
  return [roomId, role, roomCode].every(value => !value) ? (
    <BrowserRouter>{children}</BrowserRouter>
  ) : (
    <MemoryRouter initialEntries={[`/${roomCode ? roomCode : `${roomId}/${role || ''}`}`]} initialIndex={0}>
      {children}
    </MemoryRouter>
  );
};

function AppRoutes({ authTokenByRoomCodeEndpoint }: { authTokenByRoomCodeEndpoint: string }) {
  return (
    <Router>
      <>
        <ToastContainer />
        <Notifications />
        <BackSwipe />
        <FlyingEmoji />
        <RemoteStopScreenshare />
        <KeyboardHandler />
        <BeamSpeakerLabelsLogging />
        <AuthToken authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint} />
        <Routes>
          <Route path="/*" element={<RouteList />} />
        </Routes>
      </>
    </Router>
  );
}
