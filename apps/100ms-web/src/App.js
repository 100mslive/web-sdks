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
import { Box, HMSThemeProvider } from "@100mslive/react-ui";
import { AppData } from "./components/AppData/AppData.jsx";
import { BeamSpeakerLabelsLogging } from "./components/AudioLevel/BeamSpeakerLabelsLogging";
import AuthToken from "./components/AuthToken";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ErrorPage from "./components/ErrorPage";
import FullPageProgress from "./components/FullPageProgress";
import { Init } from "./components/init/Init";
import { KeyboardHandler } from "./components/Input/KeyboardInputManager";
import { Notifications } from "./components/Notifications";
import PostLeave from "./components/PostLeave";
import PreviewContainer from "./components/Preview/PreviewContainer.jsx";
import { ToastContainer } from "./components/Toast/ToastContainer";
import { AppContext, useAppContext } from "./AppContext.js";
import { hmsActions, hmsNotifications, hmsStats, hmsStore } from "./hms.js";
import { Confetti } from "./plugins/confetti";
import { FlyingEmoji } from "./plugins/FlyingEmoji.jsx";
import { RemoteStopScreenshare } from "./plugins/RemoteStopScreenshare";
import { getRoutePrefix, shadeColor } from "./common/utils";
import { FeatureFlags } from "./services/FeatureFlags";
import "./base.css";
import "./index.css";

const Conference = React.lazy(() => import("./components/conference"));

const defaultTokenEndpoint = process.env.REACT_APP_TOKEN_GENERATION_ENDPOINT;
const envPolicyConfig = JSON.parse(process.env.REACT_APP_POLICY_CONFIG || "{}");

let appName;
if (window.location.host.includes("localhost")) {
  appName = "localhost";
} else {
  appName = window.location.host.split(".")[0];
}

document.title = `${appName}'s ${document.title}`;

// TODO: remove now that there are options to change to portrait
const getAspectRatio = ({ width, height }) => {
  const host = process.env.REACT_APP_HOST_NAME || window.location.hostname;
  const portraitDomains = (
    process.env.REACT_APP_PORTRAIT_MODE_DOMAINS || ""
  ).split(",");
  if (portraitDomains.includes(host) && width > height) {
    return { width: height, height: width };
  }
  return { width, height };
};

export const HMSRoom = React.forwardRef(
  (
    {
      tokenEndpoint = defaultTokenEndpoint,
      themeConfig: {
        aspectRatio = "1-1",
        font = "Roboto",
        color = "#2F80FF",
        theme = "dark",
        logo = "",
        metadata = "",
        recordingUrl = "",
      },
      policyConfig = envPolicyConfig,
      getDetails = () => {},
      authTokenByRoomCodeEndpoint = "https://auth-nonprod.100ms.live/v2/token",
      roomId,
      role,
      roomCode,
      showPreview = true,
      showLeave = true,
      onLeave = () => {},
    },
    ref
  ) => {
    const { 0: width, 1: height } = aspectRatio
      .split("-")
      .map(el => parseInt(el));
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

    return (
      <ErrorBoundary>
        <AppContext.Provider
          value={{ roomId, role, roomCode, showPreview, showLeave, onLeave }}
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
                policyConfig={policyConfig}
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

const Redirector = ({ getDetails, showPreview }) => {
  const { roomId, role } = useParams();
  useEffect(() => {
    getDetails();
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

const RouteList = ({ getDetails }) => {
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

const Router = ({ children }) => {
  const { roomId, role, roomCode } = useAppContext;
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

function AppRoutes({ getDetails, authTokenByRoomCodeEndpoint }) {
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
    <HMSRoom
      themeConfig={{
        aspectRatio: process.env.REACT_APP_TILE_SHAPE,
        theme: process.env.REACT_APP_THEME,
        color: process.env.REACT_APP_COLOR,
        logo: process.env.REACT_APP_LOGO,
        font: process.env.REACT_APP_FONT,
        metadata: process.env.REACT_APP_DEFAULT_APP_DETAILS, // A stringified object in env
      }}
      showPreview={false}
    />
  );
}
