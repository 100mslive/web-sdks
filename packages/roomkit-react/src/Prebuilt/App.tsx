import React, { MutableRefObject, useEffect, useRef } from 'react';
import { usePreviousDistinct } from 'react-use';
import {
  HMSRoomState,
  HMSStatsStoreWrapper,
  HMSStoreWrapper,
  IHMSNotifications,
  selectRoomState,
} from '@100mslive/hms-video-store';
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
import AuthToken from './components/AuthToken';
// @ts-ignore: No implicit Any
import Conference from './components/Conference';
// @ts-ignore: No implicit Any
import { ErrorBoundary } from './components/ErrorBoundary';
// @ts-ignore: No implicit Any
import { Init } from './components/init/Init';
// @ts-ignore: No implicit Any
import { KeyboardHandler } from './components/Input/KeyboardInputManager';
import { MwebLandscapePrompt } from './components/MwebLandscapePrompt';
import { Notifications } from './components/Notifications';
// @ts-ignore: No implicit Any
import PostLeave from './components/PostLeave';
// @ts-ignore: No implicit Any
import PreviewContainer from './components/Preview/PreviewContainer';
// @ts-ignore: No implicit Any
import { ToastContainer } from './components/Toast/ToastContainer';
import { RoomLayoutContext, RoomLayoutProvider, useRoomLayout } from './provider/roomLayoutProvider';
import { DialogContainerProvider } from '../context/DialogContext';
import { Box } from '../Layout';
import { globalStyles, HMSThemeProvider } from '../Theme';
import { HMSPrebuiltContext } from './AppContext';
import { AppStateContext, PrebuiltStates } from './AppStateContext';
// @ts-ignore: No implicit Any
import { FlyingEmoji } from './plugins/FlyingEmoji';
// @ts-ignore: No implicit Any
import { RemoteStopScreenshare } from './plugins/RemoteStopScreenshare';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled } from './components/AppData/useUISettings';
import { useAutoStartStreaming } from './components/hooks/useAutoStartStreaming';
import { useRedirectToLeave } from './components/hooks/useRedirectToLeave';
import {
  useRoomLayoutLeaveScreen,
  useRoomLayoutPreviewScreen,
} from './provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { FeatureFlags } from './services/FeatureFlags';

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
  onJoin?: () => void;
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
      onJoin,
    },
    ref,
  ) => {
    const metadata = '';
    const reactiveStore = useRef<HMSPrebuiltRefType>();
    const containerID = 'prebuilt-container';

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
            onJoin,
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
                      <DialogContainerProvider dialogContainerSelector={`#${containerID}`}>
                        <Box
                          id={containerID}
                          css={{
                            bg: '$background_dim',
                            size: '100%',
                            lineHeight: '1.5',
                            '-webkit-text-size-adjust': '100%',
                            position: 'relative',
                          }}
                        >
                          <AppRoutes
                            authTokenByRoomCodeEndpoint={tokenByRoomCodeEndpoint}
                            defaultAuthToken={authToken}
                          />
                        </Box>
                      </DialogContainerProvider>
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

const AppStates = ({ activeState }: { activeState: PrebuiltStates }) => {
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  useAutoStartStreaming();

  function renderContent(state: PrebuiltStates) {
    switch (state) {
      case PrebuiltStates.PREVIEW:
        return isPreviewScreenEnabled ? <PreviewContainer /> : null;
      case PrebuiltStates.MEETING:
        return <Conference />;
      case PrebuiltStates.LEAVE:
        return isLeaveScreenEnabled ? <PostLeave /> : null;
    }
  }
  return <>{renderContent(activeState)}</>;
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

function AppRoutes({
  authTokenByRoomCodeEndpoint,
  defaultAuthToken,
}: {
  authTokenByRoomCodeEndpoint: string;
  defaultAuthToken?: string;
}) {
  const roomLayout = useRoomLayout();
  const isNotificationsDisabled = useIsNotificationDisabled();
  const [activeState, setActiveState] = React.useState<PrebuiltStates | undefined>();
  const roomState = useHMSStore(selectRoomState);
  const prevRoomState = usePreviousDistinct(roomState);
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const { redirectToLeave } = useRedirectToLeave();

  useEffect(() => {
    if (!roomLayout) {
      return;
    }
    if (roomState === HMSRoomState.Connected) {
      setActiveState(PrebuiltStates.MEETING);
    } else if (
      prevRoomState &&
      [HMSRoomState.Reconnecting, HMSRoomState.Connected].includes(prevRoomState) &&
      [HMSRoomState.Disconnecting, HMSRoomState.Disconnected].includes(roomState)
    ) {
      redirectToLeave().then(() => {
        const goTo = isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING;
        setActiveState(isLeaveScreenEnabled ? PrebuiltStates.LEAVE : goTo);
      });
    } else if (!prevRoomState && roomState === HMSRoomState.Disconnected) {
      setActiveState(isPreviewScreenEnabled ? PrebuiltStates.PREVIEW : PrebuiltStates.MEETING);
    }
  }, [roomLayout, roomState, isLeaveScreenEnabled, isPreviewScreenEnabled, prevRoomState, redirectToLeave]);
  return (
    <AppStateContext.Provider value={{ activeState, setActiveState }}>
      <>
        <ToastContainer />
        <Notifications />
        <MwebLandscapePrompt />
        <BackSwipe />
        {!isNotificationsDisabled && <FlyingEmoji />}
        <RemoteStopScreenshare />
        <KeyboardHandler />
        <AuthToken authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint} defaultAuthToken={defaultAuthToken} />
        {roomLayout && activeState && <AppStates activeState={activeState} />}
      </>
    </AppStateContext.Provider>
  );
}
