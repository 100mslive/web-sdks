import { useState } from "react";
import { HMSDiagnostics } from "@100mslive/hms-diagnostics";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import { Accordion, Button, Flex, Text } from "@100mslive/react-ui";

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

const Diagnostics = () => {
  const [result, setResult] = useState([]);
  const [inProgress, setInProgress] = useState(false);
  return (
    <Flex direction="column" css={{ size: "100%", overflowY: "auto" }}>
      <Button
        disabled={inProgress}
        css={{ width: 200, m: "$8" }}
        onClick={async () => {
          setResult([]);
          setInProgress(true);
          await diagnostics.start({
            onUpdate: (result, path) => {
              setResult(res =>
                res.concat({ ...result, title: path.split(".").at(-1) })
              );
            },
          });
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
