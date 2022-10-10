import { useState } from "react";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import { Accordion, Button, Flex, Text } from "@100mslive/react-ui";

const diagnostics = new HMSDiagnostics();

const DiagnosticsItem = ({ title, properties }) => {
  return (
    <Accordion.Item value={title}>
      <Accordion.Header>
        <Flex align="center">
          <Text variant="body">{title}</Text>
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

const Diagnostics = () => {
  const [result, setResult] = useState(null);
  const [inProgress, setInProgress] = useState(false);
  return (
    <Flex direction="column" css={{ size: "100%", overflowY: "auto" }}>
      <Button
        disabled={inProgress}
        css={{ width: 200, m: "$8" }}
        onClick={async () => {
          setInProgress(true);
          const result = await diagnostics.start({ onUpdate: setResult });
          setResult(result);
          setInProgress(false);
        }}
      >
        Start Diagnostics
      </Button>
      {result && (
        <Accordion.Root type="single" defaultValue="webRTC">
          <DiagnosticsItem title="WebRTC" properties={result.webRTC} />
          {Object.keys(result.connectivity).map(key => {
            const connection = result.connectivity[key];
            return (
              <DiagnosticsItem key={key} title={key} properties={connection} />
            );
          })}
          <DiagnosticsItem title="Devices" properties={result.devices} />
          <DiagnosticsItem title="Camera" properties={result.devices.camera} />
          <DiagnosticsItem
            title="Microphone"
            properties={result.devices.microphone}
          />
        </Accordion.Root>
      )}
    </Flex>
  );
};

export default Diagnostics;
