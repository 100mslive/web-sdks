/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import {
  HMSRoomProvider,
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, HMSThemeProvider, ThemeTypes } from "@100mslive/react-ui";
import { AppData } from "./components/AppData/AppData";
import { BeamSpeakerLabelsLogging } from "./components/AudioLevel/BeamSpeakerLabelsLogging";
import AuthToken from "./components/AuthToken";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";
import FullPageProgress from "./components/FullPageProgress";
import { Init } from "./components/init/Init";
import { KeyboardHandler } from "./components/Input/KeyboardInputManager";
import { Notifications } from "./components/Notifications";
import PostLeave from "./components/PostLeave";
import PreviewContainer from "./components/Preview/PreviewContainer";
import { ToastContainer } from "./components/Toast/ToastContainer";
import { AppContext, useAppContext } from "./AppContext";
import { hmsActions, hmsNotifications, hmsStats, hmsStore } from "./hms";
import { Confetti } from "./plugins/confetti";
import { FlyingEmoji } from "./plugins/FlyingEmoji.jsx";
import { RemoteStopScreenshare } from "./plugins/RemoteStopScreenshare";
import { getRoutePrefix, shadeColor } from "./common/utils";
import { FeatureFlags } from "./services/FeatureFlags";
import "./base.css";
import "./index.css";

const Conference = React.lazy(() => import("./components/conference"));

const defaultTokenEndpoint = process.env.REACT_APP_TOKEN_GENERATION_ENDPOINT;

let appName;
if (window.location.host.includes("localhost")) {
  appName = "localhost";
} else {
  appName = window.location.host.split(".")[0];
}

document.title = `${appName}'s ${document.title}`;

export type HMSRoomCompositeProps = {
  tokenEndpoint?: string;
  themeConfig: {
    aspectRatio?: string;
    font?: string;
    color?: string;
    theme?: ThemeTypes;
    logo?: string;
    metadata?: string;
    recordingUrl?: string;
  };
  /**
   * @internal
   */
  getDetails?: () => void;
  /**
   * @internal
   */
  authTokenByRoomCodeEndpoint?: string;
  roomId?: string;
  roomCode?: string;
  role?: string;
  showPreview?: boolean;
  showLeave?: boolean;
  onLeave?: () => void;
};

export const HMSRoomComposite = React.forwardRef<
  {
    hmsActions: typeof hmsActions;
    hmsStats: typeof hmsStats;
    hmsStore: typeof hmsStore;
    hmsNotifications: typeof hmsNotifications;
  },
  HMSRoomCompositeProps
>(
  (
    {
      tokenEndpoint = defaultTokenEndpoint,
      themeConfig: {
        aspectRatio = "1-1",
        font = "Roboto",
        color = "#2F80FF",
        theme = ThemeTypes.dark,
        logo = "",
        metadata = "",
        recordingUrl = "",
      },
      getDetails,
      authTokenByRoomCodeEndpoint = "https://auth-nonprod.100ms.live/v2/token",
      roomId,
      role,
      roomCode,
      showPreview = true,
      showLeave = true,
      onLeave,
    },
    ref
  ) => {
    const [width, height] = aspectRatio.split("-").map(el => parseInt(el));

    useEffect(() => {
      if (!ref) {
        return;
      }
      //@ts-ignore
      ref.current = {
        hmsActions,
        hmsStats,
        hmsStore,
        hmsNotifications,
      };
    }, [ref]);

    return (
      <ErrorBoundary>
        <AppContext.Provider
          value={{ roomId, role, roomCode, showPreview, showLeave, onLeave }}
        >
          <HMSThemeProvider
            themeType={theme}
            aspectRatio={{ width, height }}
            theme={{
              colors: {
                //@ts-ignore
                brandDefault: color,
                brandDark: shadeColor(color, -30),
                brandLight: shadeColor(color, 30),
                brandDisabled: shadeColor(color, 10),
              },
              fonts: {
                //@ts-ignore
                sans: [font, "Inter", "sans-serif"],
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
                tokenEndpoint={tokenEndpoint}
              />

              <Init />
              <Box
                css={{
                  bg: "$mainBg",
                  size: "100%",
                }}
              >
                <AppRoutes
                  getDetails={getDetails}
                  authTokenByRoomCodeEndpoint={authTokenByRoomCodeEndpoint}
                />
              </Box>
            </HMSRoomProvider>
          </HMSThemeProvider>
        </AppContext.Provider>
      </ErrorBoundary>
    );
  }
);

const Redirector = ({
  getDetails,
  showPreview,
}: Pick<HMSRoomCompositeProps, "getDetails" | "showPreview">) => {
  const { roomId, role } = useParams();
  useEffect(() => {
    getDetails?.();
  }, [roomId]); //eslint-disable-line

  if (!roomId && !role) {
    return <Navigate to="/" />;
  }
  if (!roomId) {
    return <Navigate to="/" />;
  }
  if (["streaming", "preview", "meeting", "leave"].includes(roomId) && !role) {
    return <Navigate to="/" />;
  }

  return (
    <Navigate
      to={`${getRoutePrefix()}/${
        showPreview ? "preview" : "meeting"
      }/${roomId}/${role || ""}`}
    />
  );
};

const RouteList = ({
  getDetails,
}: Pick<HMSRoomCompositeProps, "getDetails">) => {
  const { showPreview, showLeave } = useAppContext();

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
      <Route
        path="/:roomId/:role"
        element={
          <Redirector getDetails={getDetails} showPreview={showPreview} />
        }
      />
      <Route
        path="/:roomId/"
        element={
          <Redirector getDetails={getDetails} showPreview={showPreview} />
        }
      />
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
    window.addEventListener("popstate", onRouteLeave);
    return () => {
      window.removeEventListener("popstate", onRouteLeave);
    };
  }, [hmsActions, isConnectedToRoom]);
  return null;
};

const Router = ({ children }: React.PropsWithChildren) => {
  const { roomId, role, roomCode } = useAppContext();
  return [roomId, role, roomCode].every(value => !value) ? (
    <BrowserRouter>{children}</BrowserRouter>
  ) : (
    <MemoryRouter
      initialEntries={[`/preview/${roomCode ? roomCode : `${roomId}/${role}`}`]}
      initialIndex={0}
    >
      {children}
    </MemoryRouter>
  );
};

function AppRoutes({
  getDetails,
  authTokenByRoomCodeEndpoint,
}: Pick<HMSRoomCompositeProps, "getDetails" | "authTokenByRoomCodeEndpoint">) {
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
        <Route path="/*" element={<RouteList getDetails={getDetails} />} />
        <Route
          path="/streaming/*"
          element={<RouteList getDetails={getDetails} />}
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <HMSRoomComposite
      themeConfig={{
        aspectRatio: process.env.REACT_APP_TILE_SHAPE,
        theme: process.env.REACT_APP_THEME as ThemeTypes,
        color: process.env.REACT_APP_COLOR,
        logo: process.env.REACT_APP_LOGO,
        font: process.env.REACT_APP_FONT,
        metadata: process.env.REACT_APP_DEFAULT_APP_DETAILS, // A stringified object in env
      }}
    />
  );
}
