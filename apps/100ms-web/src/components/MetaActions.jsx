import { Tooltip, Flex } from "@100mslive/react-ui";
import { BrbIcon, HandIcon } from "@100mslive/react-icons";
import { useMyMetadata } from "./hooks/useMetadata";
import IconButton from "../IconButton";

const MetaActions = ({ isMobile = false, compact = false }) => {
  const { isHandRaised, isBRBOn, toggleHandRaise, toggleBRB } = useMyMetadata();

  return (
    <Flex align="center">
      <Tooltip title={`${!isHandRaised ? "Raise" : "Unraise"} hand`}>
        <IconButton
          css={{ mx: compact ? "$2" : "$4" }}
          onClick={toggleHandRaise}
          active={!isHandRaised}
          data-testid={`${
            isMobile ? "raise_hand_btn_mobile" : "raise_hand_btn"
          }`}
        >
          <HandIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={`${isBRBOn ? `I'm back` : `I'll be right back`}`}>
        <IconButton
          css={{ mx: compact ? "$2" : "$4" }}
          onClick={toggleBRB}
          active={!isBRBOn}
          data-testid="brb_btn"
        >
          <BrbIcon />
        </IconButton>
      </Tooltip>
    </Flex>
  );
};

export default MetaActions;
