import { Flex } from "@100mslive/react-ui";

export const VideoControls = ({ children }) => {
  return (
    <Flex
      id="hms-video-controls"
      justify="center"
      align="center"
      gap={2}
      css={{ width: "100%" }}
    >
      {children}
    </Flex>
  );
};

export const LeftControls = ({ children }) => {
  return (
    <Flex
      id="hms-video-controls-left"
      justify="start"
      align="center"
      gap={2}
      css={{ width: "100%" }}
    >
      {children}
    </Flex>
  );
};

export const RightControls = ({ children }) => {
  return (
    <Flex
      id="hms-video-controls-right"
      justify="end"
      align="center"
      gap={2}
      css={{ width: "100%" }}
    >
      {children}
    </Flex>
  );
};
