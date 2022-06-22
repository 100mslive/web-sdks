import { Button, Flex, Text } from "@100mslive/react-ui";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { Fragment, useState } from "react";
import FullPageProgress from "./FullPageProgress";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";

const diagnostics = new HMSDiagnostics();

const DiagnosticsItem = ({ title, properties }) => {
  return (
    <Flex direction="column" css={{ py: "$4", mx: "$8" }}>
      <Flex>
        <Text variant="body">{title}</Text>
        {properties.success ? (
          <Text vairant="body2" css={{ color: "$green" }}>
            <CheckIcon />
          </Text>
        ) : (
          <Text variant="body2" css={{ color: "$error" }}>
            <CrossIcon />
          </Text>
        )}
      </Flex>
      {properties.errorMessage && (
        <Text variant="body">Error: {properties.errorMessage}</Text>
      )}
      {properties.info && (
        <Text variant="body" css={{ my: "$4" }}>
          Info:
          <pre>{JSON.stringify(properties.info, null, "\t")}</pre>
        </Text>
      )}
    </Flex>
  );
};

const Diagnostics = () => {
  const [result, setResult] = useState(null);
  const [inProgress, setInProgress] = useState(false);
  return (
    <Flex
      direction="column"
      justify={inProgress ? "center" : "start"}
      css={{ size: "100%", overflowY: "auto" }}
    >
      <Button
        disabled={inProgress}
        css={{ width: 200, m: "$8" }}
        onClick={async () => {
          setInProgress(true);
          const result = await diagnostics.start();
          setResult(result);
          setInProgress(false);
        }}
      >
        Start Diagnostics
      </Button>
      {inProgress && <FullPageProgress />}
      {result && (
        <Fragment>
          <DiagnosticsItem title="WebRTC" properties={result.webRTC} />
          {Object.keys(result.connectivity).map(key => {
            const connection = result.connectivity[key];
            return <DiagnosticsItem title={key} properties={connection} />;
          })}
          <DiagnosticsItem title="Devices" properties={result.devices} />
          <DiagnosticsItem title="Camera" properties={result.devices.camera} />
          <DiagnosticsItem
            title="Microphone"
            properties={result.devices.microphone}
          />
        </Fragment>
      )}
    </Flex>
  );
};

export default Diagnostics;
