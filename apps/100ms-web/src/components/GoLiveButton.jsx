import { useRecordingStreaming } from "@100mslive/react-sdk";
import { Button, Text } from "@100mslive/react-ui";
import { GoLiveIcon } from "@100mslive/react-icons";
import {
  useSidepaneToggle,
  useIsSidepaneTypeOpen,
} from "./AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "./../common/constants";

const GoLiveButton = ({ css = {} }) => {
  const isStreamingSidepaneOpen = useIsSidepaneTypeOpen(
    SIDE_PANE_OPTIONS.STREAMING
  );
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const { isHLSRunning } = useRecordingStreaming();
  if (isHLSRunning) {
    return null;
  }
  return (
    <Button
      variant={isStreamingSidepaneOpen ? "standard" : "primary"}
      onClick={toggleStreaming}
      css={{ mx: "$2", height: "$13", ...css }}
    >
      <GoLiveIcon />
      <Text variant="button" css={{ mx: "$2" }}>
        Go Live
      </Text>
    </Button>
  );
};

export default GoLiveButton;
