import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParam } from "react-use";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { v4 } from "uuid";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import { Accordion, Button, Flex, Text } from "@100mslive/react-ui";
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
    <Accordion.Item value={properties.id} css={{ p: "$4 $8" }}>
      <Accordion.Header>
        <Flex align="center">
          <Text variant="body" css={{ mr: "$2" }}>
            {title}
          </Text>
          {properties.success === null ? null : properties.success ? (
            <Text vairant="body2" css={{ color: "$green" }}>
              <CheckIcon />
            </Text>
          ) : (
            <Text variant="body2" css={{ color: "$error" }}>
              <CrossIcon />
            </Text>
          )}
        </Flex>
      </Accordion.Header>
      <Accordion.Content>
        {properties.errorMessage && (
          <Text variant="body">Error: {properties.errorMessage}</Text>
        )}
        {properties.info && (
          <Text variant="body" css={{ my: "$4" }}>
            Info:
            <pre>{JSON.stringify(properties.info, null, "\t")}</pre>
          </Text>
        )}
      </Accordion.Content>
    </Accordion.Item>
  );
};

const env = process.env.REACT_APP_ENV;
const Diagnostics = () => {
  const [result, setResult] = useState([]);
  const [inProgress, setInProgress] = useState(false);
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

  if (error.title) {
    return <ErrorDialog title={error.title}>{error.body}</ErrorDialog>;
  }

  if (!token) {
    return <FullPageProgress />;
  }

  return (
    <Flex direction="column" css={{ size: "100%", overflowY: "auto" }}>
      <Button
        disabled={inProgress}
        css={{ width: 200, m: "$8" }}
        onClick={async () => {
          setResult([]);
          setInProgress(true);
          await diagnostics.start(
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
        }}
      >
        Start Diagnostics
      </Button>
      {result && (
        <Accordion.Root
          type="single"
          defaultValue="WebRTC"
          collapsible
          css={{ w: "50%", r: "$1", m: "$8" }}
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
      )}
    </Flex>
  );
};

export default Diagnostics;
