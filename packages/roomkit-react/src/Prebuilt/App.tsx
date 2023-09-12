import React, { MutableRefObject, ReactElement, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { HMSStatsStoreWrapper, HMSStoreWrapper, IHMSNotifications } from '@100mslive/hms-video-store';
import { Layout, Logo, Screens, Theme, Typography } from '@100mslive/types-prebuilt';
// @ts-ignore: No implicit Any
import orientation from 'o9n';
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
import { config as cssConfig, globalStyles, HMSThemeProvider } from '../Theme';
import { HMSPrebuiltContext, useHMSPrebuiltContext } from './AppContext';
// @ts-ignore: No implicit Any
import { FlyingEmoji } from './plugins/FlyingEmoji';
// @ts-ignore: No implicit Any
import { RemoteStopScreenshare } from './plugins/RemoteStopScreenshare';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled } from './components/AppData/useUISettings';
import { useAutoStartStreaming } from './components/hooks/useAutoStartStreaming';
import {
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
  authToken?: string;
  roomId?: string;
  role?: string;
  onLeave?: () => void;
};

export type HMSPrebuiltRefType = {
  hmsActions: HMSActions;
  hmsStore: HMSStoreWrapper;
  hmsStats: HMSStatsStoreWrapper;
  hmsNotifications: IHMSNotifications;
};

export const HMSPrebuilt = React.forwardRef<HMSPrebuiltRefType, HMSPrebuiltProps>(
  (
    {
      roomCode = '',
      authToken = '',
      roomId = '',
      role = '',
      logo,
      typography,
      themes,
      options: { userName = '', userId = '', endpoints } = {},
      screens,
      onLeave,
    },
    ref,
  ) => {
    const metadata = '';
    const reactiveStore = useRef<HMSPrebuiltRefType>();
    const [hydrated, setHydrated] = React.useState(false);
    const isMobile = useMedia(cssConfig.media.md);
    const lockToPortrait = async () => {
      try {
        if (isMobile) {
          await orientation.lock('portrait');
        }
      } catch (e) {
        console.log(e);
      }
    };

    useEffect(() => {
      lockToPortrait();
    }, []);

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

    if (!roomCode && !(authToken && roomId && role)) {
      console.error(`
          HMSPrebuilt can be initialised by providing: 
          either just "roomCode" or "authToken" and "roomId" and "role".
          Please check if you are providing the above values for initialising prebuilt.
        `);
      throw Error('Incorrect initializing params for HMSPrebuilt component');
    }

    if (!hydrated) {
      return null;
    }

    globalStyles();

    return (
      <ErrorBoundary>
        <HMSPrebuiltContext.Provider
          value={{
            roomCode,
            roomId,
            role,
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
                        <AppRoutes authTokenByRoomCodeEndpoint={tokenByRoomCodeEndpoint} defaultAuthToken={authToken} />
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
  useAutoStartStreaming();
  return (
    <Routes>
      {isPreviewScreenEnabled ? (
        <Route path="preview">
          <Route
            path=":roomId/:role"
            element={
              <Suspense fallback={<FullPageProgress text="Loading preview..." />}>
                <PreviewContainer />
              </Suspense>
            }
          />
          <Route
            path=":roomId"
            element={
              <Suspense fallback={<FullPageProgress text="Loading preview..." />}>
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
            <Suspense fallback={<FullPageProgress text="Joining..." />}>
              <Conference />
            </Suspense>
          }
        />
        <Route
          path=":roomId"
          element={
            <Suspense fallback={<FullPageProgress text="Joining..." />}>
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

function AppRoutes({
  authTokenByRoomCodeEndpoint,
  defaultAuthToken,
}: {
  authTokenByRoomCodeEndpoint: string;
  defaultAuthToken?: string;
}) {
  const roomLayout = useRoomLayout();
  const isNotificationsDisabled = useIsNotificationDisabled();
  return (
    <Router>
      <>
        <ToastContainer />
        <Notifications />
        <BackSwipe />
        {!isNotificationsDisabled && <FlyingEmoji />}
        <RemoteStopScreenshare />
        <KeyboardHandler />
        <AuthToken authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint} defaultAuthToken={defaultAuthToken} />
        {roomLayout && (
          <Routes>
            <Route path="/*" element={<RouteList />} />
          </Routes>
        )}
      </>
    </Router>
  );
}
