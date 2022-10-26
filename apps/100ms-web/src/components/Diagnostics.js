import { useState } from "react";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import { Accordion, Button, Flex, Loading, Text } from "@100mslive/react-ui";

const diagnostics = new HMSDiagnostics();

const DiagnosticsItem = ({ title, properties, loading } = {}) => {
  if (!title || !properties) {
    return null;
  }
  return (
    <Accordion.Item value={title} css={{ p: "$4 $8" }}>
      <Accordion.Header>
        <Flex align="center">
          <Text variant="body" css={{ mr: "$2" }}>
            {title}
          </Text>
          {loading && properties.success === null ? (
            <Loading size={24} />
          ) : null}
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
  const [step, setStep] = useState(-1);
  return (
    <Flex direction="column" css={{ size: "100%", overflowY: "auto" }}>
      <Button
        disabled={step > -1}
        css={{ width: 200, m: "$8" }}
        onClick={async () => {
          setResult(null);
          setStep(step => step + 1);
          const result = await diagnostics.start({
            onUpdate: result => {
              setStep(step => step + 1);
              setResult({
                ...result,
                connectivity: { ...result.connectivity },
                devices: { ...result.devices },
              });
            },
          });
          setResult(result);
          setStep(-1);
        }}
      >
        Start Diagnostics
      </Button>
      {result && (
        <Accordion.Root
          type="single"
          defaultValue="WebRTC"
          css={{ w: "50%", r: "$1" }}
        >
          <DiagnosticsItem
            title="WebRTC"
            properties={result.webRTC}
            loading={step === 0}
          />
          <DiagnosticsItem
            title="Init"
            properties={result.connectivity.init}
            loading={step === 1}
          />
          <DiagnosticsItem
            title="websocket"
            properties={result.connectivity.websocket}
            loading={step === 2}
          />
          <DiagnosticsItem
            title="stunUDP"
            properties={result.connectivity.stunUDP}
            loading={step === 3}
          />
          <DiagnosticsItem
            title="stunTCP"
            properties={result.connectivity.stunTCP}
            loading={step === 4}
          />
          <DiagnosticsItem
            title="turnUDP"
            properties={result.connectivity.turnUDP}
            loading={step === 5}
          />
          <DiagnosticsItem
            title="turnTCP"
            properties={result.connectivity.turnTCP}
            loading={step === 6}
          />
          <DiagnosticsItem
            title="Devices"
            properties={result.devices}
            loading={step === 7}
          />
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
