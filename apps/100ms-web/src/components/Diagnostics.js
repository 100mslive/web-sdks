import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParam } from "react-use";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { v4 } from "uuid";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import {
  Accordion,
  Flex,
  StyledVideo,
  Text,
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

const DiagnosticsItem = ({ title, properties } = {}) => {
  if (!title || !properties) {
    return null;
  }
  return (
    <Accordion.Item
      value={properties.id}
      css={{ p: "$4 $8", borderBottom: "1px solid $backgroundDefault" }}
    >
      <Accordion.Header>
        <Flex
          align="center"
          css={{ width: "100%", justifyContent: "space-between" }}
        >
          <Text variant="lg" css={{ mr: "$2" }}>
            {title}
          </Text>
          {properties.success === null ? null : properties.success ? (
            <Flex css={{ color: "$success", alignItems: "center", mx: "$10" }}>
              <Text variant="body2" css={{ color: "$success" }}>
                Passed
              </Text>
              <CheckIcon />
            </Flex>
          ) : (
            <Flex css={{ color: "$error", alignItems: "center", mx: "$10" }}>
              <Text variant="body2" css={{ color: "$error" }}>
                Failed
              </Text>
              <CrossIcon />
            </Flex>
          )}
        </Flex>
      </Accordion.Header>
      <Accordion.Content>
        <Flex direction="column" css={{ overflowX: "auto" }}>
          {properties.description && (
            <Text variant="body" css={{ my: "$4" }}>
              {properties.description}
            </Text>
          )}
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
        </Flex>
      </Accordion.Content>
    </Accordion.Item>
  );
};

const VideoTile = React.memo(({ track }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (track) {
      const videoElement = videoRef.current;
      const srcObject = videoElement.srcObject;
      if (srcObject !== null && srcObject instanceof MediaStream) {
        const existingTrackID = srcObject.getVideoTracks()[0]?.id;
        if (existingTrackID === track.id) {
          // it's already attached, attaching again would just cause flickering
          return;
        }
      }
      videoElement.srcObject = new MediaStream([track]);
    }
  }, [track]);

  return (
    <Flex direction="column" css={{ w: "60%" }}>
      <StyledVideo
        autoPlay
        muted
        playsInline
        controls={false}
        ref={videoRef}
        mirror={true}
      />
      <Text css={{ textAlign: "center", my: "$3" }}>
        Camera Used: {track.label}
      </Text>
    </Flex>
  );
});

const Header = () => {
  return (
    <Flex css={{ p: "$8" }}>
      <Flex align="center">
        <Logo />
        <VerticalDivider css={{ mx: "$4" }} />
        <Text variant="h4">Diagnostics</Text>
      </Flex>
    </Flex>
  );
};

const env = process.env.REACT_APP_ENV;
const Diagnostics = () => {
  const [result, setResult] = useState([]);
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
      diagnostics.start(
        {
          authToken: token,
          initEndpoint: `https://${env}-init.100ms.live/`,
        },
        {
          onUpdate: (result, path) => {
            setResult(res =>
              res.concat({ ...result, title: path.split(".").at(-1) })
            );
          },
        }
      );
    }
  }, [token]);

  const videoTrack = useMemo(
    () => result.find(item => item.title.includes("camera"))?.info.videoTrack,
    [result]
  );

  const audioTrack = useMemo(
    () =>
      result.find(item => item.title.includes("microphone"))?.info.audioTrack,
    [result]
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
      {result && (
        <Flex>
          <Accordion.Root
            type="single"
            defaultValue="WebRTC"
            collapsible
            css={{
              w: "40%",
              m: "$8",
            }}
          >
            {result.map(item => {
              return (
                <DiagnosticsItem
                  key={item.id}
                  title={item.title}
                  properties={item}
                />
              );
            })}
          </Accordion.Root>
          <Flex
            direction="column"
            css={{
              width: "60%",
              pt: "$20",
              alignItems: "center",
            }}
          >
            {videoTrack && <VideoTile track={videoTrack} />}
            {audioTrack && <Text>Microphone Used: {audioTrack.label}</Text>}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Diagnostics;
