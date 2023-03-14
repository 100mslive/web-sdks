import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { useSearchParam } from "react-use";
import {
  HMSDiagnostics,
  HMSDiagnosticsCheck,
  TrackAudioLevelMonitor,
} from "@100mslive/hms-diagnostics";
import { v4 } from "uuid";
import {
  Accordion,
  Button,
  Flex,
  Loading,
  StyledVideo,
  Text,
  useTheme,
  VerticalDivider,
} from "@100mslive/react-ui";
import { Logo } from "./Header/HeaderComponents";
import { ErrorDialog } from "../primitives/DialogContent";
import FullPageProgress from "./FullPageProgress";
import { useTokenEndpoint } from "./AppData/useUISettings";
import {
  convertTokenError,
  getToken,
  getUserToken,
} from "../services/tokenService";
import { QUERY_PARAM_AUTH_TOKEN } from "../common/constants";

const diagnostics = new HMSDiagnostics();
const HMSDiagnosticsChecks = Object.keys(HMSDiagnosticsCheck);

const DiagnosticsItem = ({ name, properties } = {}) => {
  if (!name) {
    return null;
  }
  const description = diagnostics.getDescriptionForCheck(name);

  return (
    <Accordion.Item
      value={properties ? properties.id : name}
      css={{
        p: "$4 $8",
        borderBottom: "1px solid $backgroundDefault",
        cursor: "pointer",
      }}
    >
      <Accordion.Header>
        <Flex
          align="center"
          css={{ width: "100%", justifyContent: "space-between" }}
        >
          <Text variant="lg" css={{ mr: "$2" }}>
            {name}
          </Text>
          {properties ? (
            properties.success ? (
              <Text variant="body2" css={{ color: "$success", mx: "$6" }}>
                Passed
              </Text>
            ) : (
              <Text variant="body2" css={{ color: "$error", mx: "$6" }}>
                Failed
              </Text>
            )
          ) : (
            <Loading />
          )}
        </Flex>
      </Accordion.Header>
      <Accordion.Content>
        <Flex direction="column" css={{ overflowX: "auto" }}>
          {description && (
            <Text variant="body" css={{ my: "$4" }}>
              {description}
            </Text>
          )}
          {properties && (
            <>
              {properties.errorMessage && (
                <Text variant="body" css={{ my: "$4" }}>
                  Error: {properties.errorMessage}
                </Text>
              )}
              {properties.info && (
                <Text variant="body" css={{ my: "$4" }}>
                  Info:
                  <pre>{JSON.stringify(properties.info, null, "\t")}</pre>
                </Text>
              )}
            </>
          )}
        </Flex>
      </Accordion.Content>
    </Accordion.Item>
  );
};

const sigmoid = z => {
  return 1 / (1 + Math.exp(-z));
};

const AUDIO_LEVEL_THRESHOLD = 35;

function useAudioLevelStyles(track, ref) {
  const audioLevelMonitor = useRef(null);
  const { theme } = useTheme();
  const color = theme.colors.brandDefault.value;
  const getStyle = useCallback(
    level => {
      const style = {
        transition: "box-shadow 0.4s ease-in-out",
      };
      style["box-shadow"] = level
        ? `0px 0px ${24 * sigmoid(level)}px ${color}, 0px 0px ${
            16 * sigmoid(level)
          }px ${color}`
        : "";
      return style;
    },
    [color]
  );

  useEffect(() => {
    if (track) {
      audioLevelMonitor.current = new TrackAudioLevelMonitor(track, level => {
        if (!ref.current) {
          return;
        }
        level = level > AUDIO_LEVEL_THRESHOLD ? level : 0;

        const styles = getStyle(level);
        for (const key in styles) {
          ref.current.style[key] = styles[key];
        }
      });
      audioLevelMonitor.current.start();
    }

    return () => {
      audioLevelMonitor.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);
}

const VideoTile = React.memo(({ videoTrack, audioTrack }) => {
  const videoRef = useRef();
  useAudioLevelStyles(audioTrack, videoRef);

  useEffect(() => {
    if (videoTrack) {
      const videoElement = videoRef.current;
      const srcObject = videoElement.srcObject;
      if (srcObject !== null && srcObject instanceof MediaStream) {
        const existingTrackID = srcObject.getVideoTracks()[0]?.id;
        if (existingTrackID === videoTrack.id) {
          // it's already attached, attaching again would just cause flickering
          return;
        }
      }
      videoElement.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  return (
    <Flex direction="column" css={{ w: "60%" }}>
      {videoTrack && (
        <>
          <StyledVideo
            autoPlay
            muted
            playsInline
            controls={false}
            ref={videoRef}
            mirror={true}
          />
          <Text css={{ textAlign: "center", mb: "$3", mt: "$10" }}>
            Camera Used: {videoTrack.label}
          </Text>
        </>
      )}
      {audioTrack && (
        <Text css={{ textAlign: "center", my: "$3" }}>
          Microphone Used: {audioTrack.label}
        </Text>
      )}
    </Flex>
  );
});

const Header = () => {
  return (
    <Flex css={{ p: "$8" }}>
      <Flex align="center">
        <Logo />
        <VerticalDivider css={{ mx: "$4" }} />
        <Text variant="h5">Diagnostics</Text>
      </Flex>
    </Flex>
  );
};

const downloadJson = (obj, fileName) => {
  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  a.href = URL.createObjectURL(file);
  a.download = `${fileName}.json`;
  a.click();
};

const env = process.env.REACT_APP_ENV;
const Diagnostics = () => {
  const [results, setResults] = useState([]);
  const [jsonResult, setJsonResult] = useState();
  const tokenEndpoint = useTokenEndpoint();
  const { roomId: urlRoomId, role: userRole } = useParams(); // from the url
  const [token, setToken] = useState(null);
  const [error, setError] = useState({ title: "", body: "" });

  let authToken = useSearchParam(QUERY_PARAM_AUTH_TOKEN);

  useEffect(() => {
    if (authToken) {
      setToken(authToken);
      return;
    }
    if (!tokenEndpoint || !urlRoomId) {
      return;
    }
    const getTokenFn = !userRole
      ? () => getUserToken(v4())
      : () => getToken(tokenEndpoint, v4(), userRole, urlRoomId);
    getTokenFn()
      .then(token => {
        setToken(token);
      })
      .catch(error => {
        setError(convertTokenError(error));
      });
  }, [tokenEndpoint, urlRoomId, userRole, authToken]);

  useEffect(() => {
    if (token) {
      diagnostics
        .start(
          {
            authToken: token,
            initEndpoint: `https://${env}-init.100ms.live/`,
          },
          {
            onUpdate: (update, path) => {
              setResults(res => res.concat(update));
            },
          }
        )
        .then(res => {
          console.log(JSON.stringify(res, null, "\t"));
          setJsonResult(res);
        });
    }
  }, [token]);

  const videoTrack = useMemo(
    () =>
      results.find(item => item.name.toLowerCase().includes("camera"))?.info
        .videoTrack,
    [results]
  );

  const audioTrack = useMemo(
    () =>
      results.find(item => item.name.toLowerCase().includes("microphone"))?.info
        .audioTrack,
    [results]
  );

  if (error.title) {
    return <ErrorDialog title={error.title}>{error.body}</ErrorDialog>;
  }

  if (!token) {
    return <FullPageProgress />;
  }

  return (
    <Flex direction="column" css={{ size: "100%", overflowY: "auto" }}>
      <Header />
      {results && (
        <Flex>
          <Flex
            direction="column"
            css={{
              w: "40%",
              m: "$8",
            }}
          >
            <Accordion.Root defaultValue="WebRTC" type="multiple" collapsible>
              {HMSDiagnosticsChecks.map(name => {
                const checkResults = results.filter(
                  check => check.name === name
                );
                // check loading
                if (checkResults.length === 0) {
                  return <DiagnosticsItem key={name} name={name} />;
                } else {
                  return checkResults.map(item => (
                    <DiagnosticsItem
                      key={item.id}
                      name={item.name}
                      properties={item}
                    />
                  ));
                }
              })}
            </Accordion.Root>
            {jsonResult && (
              <Flex css={{ w: "100%", justifyContent: "center", my: "$10" }}>
                <Button
                  onClick={() => downloadJson(jsonResult, "diagnostics_result")}
                >
                  Download Results
                </Button>
              </Flex>
            )}
          </Flex>
          <Flex
            direction="column"
            css={{
              width: "60%",
              pt: "$20",
              alignItems: "center",
            }}
          >
            <VideoTile videoTrack={videoTrack} audioTrack={audioTrack} />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Diagnostics;
