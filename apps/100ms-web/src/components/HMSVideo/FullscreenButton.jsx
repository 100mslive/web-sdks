import { Flex, IconButton, Tooltip } from "@100mslive/react-ui";

export const FullScreenButton = ({ icon, onToggle }) => {
  return (
    <IconButton
      variant="standard"
      css={{ margin: "0px" }}
      onClick={onToggle}
      key="fullscreen_btn"
      data-testid="fullscreen_btn"
    >
      <Tooltip title="Go fullscreen">
        <Flex>{icon}</Flex>
      </Tooltip>
    </IconButton>
  );
};
