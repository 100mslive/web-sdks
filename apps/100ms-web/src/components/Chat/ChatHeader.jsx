import React from "react";
import { Flex, IconButton, Text } from "@100mslive/react-ui";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CrossIcon,
  PeopleIcon,
} from "@100mslive/react-icons";

export const ChatHeader = ({
  selection,
  unreadCount,
  open,
  onToggle,
  onClose,
}) => {
  return (
    <Flex
      onClick={onToggle}
      align="center"
      css={{
        bg: "$menuBg",
        color: "$textPrimary",
        h: "$16",
        borderTopLeftRadius: "$2",
        borderTopRightRadius: "$2",
        pl: "$8",
        pr: "$4",
      }}
    >
      <PeopleIcon />
      <Text css={{ mx: "$2" }}>{selection}</Text>
      {open ? (
        <ChevronUpIcon width={18} height={18} />
      ) : (
        <ChevronDownIcon width={18} height={18} />
      )}
      <IconButton
        css={{ ml: "auto" }}
        onClick={e => {
          e.stopPropagation();
          open ? onToggle() : onClose();
        }}
      >
        <CrossIcon />
      </IconButton>
    </Flex>
  );
};
