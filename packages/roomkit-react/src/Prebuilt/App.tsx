import React, { MutableRefObject, useEffect, useRef } from 'react';
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
import { AppData } from './components/AppData/AppData';
// @ts-ignore: No implicit Any
import AuthToken from './components/AuthToken';
import { ConferenceScreen } from './components/ConferenceScreen';
// @ts-ignore: No implicit Any
import { ErrorBoundary } from './components/ErrorBoundary';
// @ts-ignore: No implicit Any
import { Init } from './components/init/Init';
// @ts-ignore: No implicit Any
import { KeyboardHandler } from './components/Input/KeyboardInputManager';
import { LeaveScreen } from './components/LeaveScreen';
import { MwebLandscapePrompt } from './components/MwebLandscapePrompt';
import { Notifications } from './components/Notifications';
import { PreviewScreen } from './components/Preview/PreviewScreen';
// @ts-ignore: No implicit Any
import { ToastContainer } from './components/Toast/ToastContainer';
import { VBHandler } from './components/VirtualBackground/VBHandler';
import { Sheet } from './layouts/Sheet';
import { RoomLayoutContext, RoomLayoutProvider, useRoomLayout } from './provider/roomLayoutProvider';
import { DialogContainerProvider } from '../context/DialogContext';
import { Box } from '../Layout';
import { globalStyles, HMSThemeProvider } from '../Theme';
import { HMSPrebuiltContext } from './AppContext';
import { AppStateContext, PrebuiltStates, useAppStateManager } from './AppStateContext';
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
import { DEFAULT_PORTAL_CONTAINER } from './common/constants';

export type HMSPrebuiltOptions = {
  userName?: string;
  userId?: string;
  endpoints?: object;
  effectsSDKKey?: string;
};

export type HMSPrebuiltProps = {
  roomCode?: string;
  logo?: Logo;
  typography?: Typography;
  themes?: Theme[];
  options?: HMSPrebuiltOptions;
  screens?: Screens;
  authToken?: string;
  onLeave?: () => void;
  onJoin?: () => void;
  /**
   * @remarks
   * Specify css selectors for the HTML element to be used as container for dialogs. Affects the positioning and focus of dialogs.
   */
  containerSelector?: string;
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
      containerSelector = DEFAULT_PORTAL_CONTAINER,
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

    useEffect(() => {
      // leave room when component unmounts
      return () => {
        VBHandler.reset();
        reactiveStore?.current?.hmsActions.leave();
      };
    }, []);

    const endpointsObj = endpoints as
      | {
          init: string;
          tokenByRoomCode: string;
          roomLayout: string;
        }
      | undefined;
    const tokenByRoomCodeEndpoint: string = endpointsObj?.tokenByRoomCode || '';
    const initEndpoint: string = endpointsObj?.init || '';
    const roomLayoutEndpoint: string = endpointsObj?.roomLayout || '';

    const overrideLayout: Partial<Layout> = {
      logo,
      themes,
      typography,
      screens,
    };

    if (!roomCode && !authToken) {
      console.error(`
          HMSPrebuilt can be initialised by providing: 
          either "roomCode" or "authToken".
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
            containerSelector,
            onLeave,
            onJoin,
            userName,
            userId,
            endpoints: {
              tokenByRoomCode: tokenByRoomCodeEndpoint,
              init: initEndpoint,
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
                      <Init />
                      <DialogContainerProvider dialogContainerSelector={containerSelector}>
                        <Box
                          className={DEFAULT_PORTAL_CONTAINER.slice(1)} // Skips the '.' in the selector
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

  if (activeState === PrebuiltStates.PREVIEW && isPreviewScreenEnabled) {
    return <PreviewScreen />;
  } else if (activeState === PrebuiltStates.LEAVE && isLeaveScreenEnabled) {
    return <LeaveScreen />;
  }
  return <ConferenceScreen />;
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
  const { activeState, rejoin } = useAppStateManager();

  return (
    <AppStateContext.Provider value={{ rejoin }}>
      <>
        {activeState !== PrebuiltStates.LEAVE && <AppData />}
        <ToastContainer />
        <Notifications />
        <MwebLandscapePrompt />
        <Sheet />
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
