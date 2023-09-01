import React, { MutableRefObject, ReactElement, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HMSStatsStoreWrapper, HMSStoreWrapper, IHMSNotifications } from '@100mslive/hms-video-store';
import { Layout, Logo, Screens, Theme, Typography } from '@100mslive/types-prebuilt';
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
import { RoomLayoutContext, RoomLayoutProvider, useRoomLayout } from './provider/roomLayoutProvider';
import { Box } from '../Layout';
import { globalStyles, HMSThemeProvider } from '../Theme';
import { HMSPrebuiltContext, useHMSPrebuiltContext } from './AppContext';
// @ts-ignore: No implicit Any
import { FlyingEmoji } from './plugins/FlyingEmoji';
// @ts-ignore: No implicit Any
import { RemoteStopScreenshare } from './plugins/RemoteStopScreenshare';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from './provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { FeatureFlags } from './services/FeatureFlags';

// @ts-ignore: No implicit Any
const Conference = React.lazy(() => import('./components/conference'));

export type HMSPrebuiltOptions = {
  userName?: string;
  userId?: string;
  endpoints?: object;
};

export type HMSPrebuiltProps = {
  roomCode?: string;
  logo?: Logo;
  typography?: Typography;
  themes?: Theme[];
  options?: HMSPrebuiltOptions;
  screens?: Screens;
  onLeave?: () => void;
};

export type HMSPrebuiltRefType = {
  hmsActions: HMSActions;
  hmsStore: HMSStoreWrapper;
  hmsStats: HMSStatsStoreWrapper;
  hmsNotifications: IHMSNotifications;
};

// TODO: remove now that there are options to change to portrait
const getAspectRatio = ({ width, height }: { width: number; height: number }) => {
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
      options: { userName = '', userId = '', endpoints } = {},
      screens,
      onLeave,
    },
    ref,
  ) => {
    const aspectRatio = '1-1';
    const metadata = '';
    const { 0: width, 1: height } = aspectRatio.split('-').map(el => parseInt(el));
    const reactiveStore = useRef<HMSPrebuiltRefType>();

    const [hydrated, setHydrated] = React.useState(false);
    useEffect(() => {
      setHydrated(true);
      const hms = new HMSReactiveStore();
      const hmsStore = hms.getStore();
      const hmsActions = hms.getActions();
      const hmsNotifications = hms.getNotifications();
      const hmsStats = hms.getStats();
      hms.triggerOnSubscribe();

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
      (ref as MutableRefObject<HMSPrebuiltRefType>).current = { ...reactiveStore.current };
    }, [ref]);

    // leave room when component unmounts
    useEffect(
      () => () => {
        reactiveStore?.current?.hmsActions.leave();
      },
      [],
    );

    const endpointsObj = endpoints as
      | {
          init: string;
          tokenByRoomCode: string;
          tokenByRoomIdRole: string;
          roomLayout: string;
        }
      | undefined;
    const tokenByRoomCodeEndpoint: string = endpointsObj?.tokenByRoomCode || '';
    const initEndpoint: string = endpointsObj?.init || '';
    const roomLayoutEndpoint: string = endpointsObj?.roomLayout || '';
    const tokenByRoomIdRoleEndpoint: string = endpointsObj?.tokenByRoomIdRole || '';

    const overrideLayout: Partial<Layout> = {
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
            onLeave,
            userName,
            userId,
            endpoints: {
              tokenByRoomCode: tokenByRoomCodeEndpoint,
              init: initEndpoint,
              tokenByRoomIdRole: tokenByRoomIdRoleEndpoint,
              roomLayout: roomLayoutEndpoint,
            },
          }}
        >
          <HMSRoomProvider
            isHMSStatsOn={FeatureFlags.enableStatsForNerds}
            actions={reactiveStore.current?.hmsActions}
            store={reactiveStore.current?.hmsStore}
            notifications={reactiveStore.current?.hmsNotifications}
            stats={reactiveStore.current?.hmsStats}
          >
            <RoomLayoutProvider roomLayoutEndpoint={roomLayoutEndpoint} overrideLayout={overrideLayout}>
              <RoomLayoutContext.Consumer>
                {data => {
                  const layout = data?.layout;
                  const theme: Theme = layout?.themes?.[0] || ({} as Theme);
                  const { typography } = layout || {};
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
                        //@ts-ignore: Prebuilt theme to match stiches theme
                        colors: theme.palette,
                        fonts: {
                          //@ts-ignore: font list to match token types of stiches
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
  return <Navigate to={`/${showPreview ? 'preview' : 'meeting'}/${roomId}/${role || ''}`} />;
};

const RouteList = () => {
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  return (
    <Routes>
      {isPreviewScreenEnabled ? (
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
      ) : null}
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
      {isLeaveScreenEnabled ? (
        <Route path="leave">
          <Route path=":roomId/:role" element={<PostLeave />} />
          <Route path=":roomId" element={<PostLeave />} />
        </Route>
      ) : null}

      <Route path="/:roomId/:role" element={<Redirector showPreview={isPreviewScreenEnabled} />} />
      <Route path="/:roomId/" element={<Redirector showPreview={isPreviewScreenEnabled} />} />
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
  const roomLayout = useRoomLayout();
  const { screenType } = useRoomLayoutConferencingScreen();
  return (
    <Router>
      <>
        <ToastContainer />
        <Notifications />
        <BackSwipe />
        {screenType !== 'hls_live_streaming' && <FlyingEmoji />}
        <RemoteStopScreenshare />
        <KeyboardHandler />
        <BeamSpeakerLabelsLogging />
        <AuthToken authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint} />
        {roomLayout && (
          <Routes>
            <Route path="/*" element={<RouteList />} />
          </Routes>
        )}
      </>
    </Router>
  );
}
