import React, { Fragment } from "react";
import {
  selectAvailableRoleNames,
  selectRemotePeers,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Flex, HorizontalDivider, Text } from "@100mslive/react-ui";
import { ChatDotIcon } from "./ChatDotIcon";

const SelectorItem = ({ value, active, onClick }) => {
  return (
    <Flex
      onClick={onClick}
      css={{ cursor: "pointer", p: "$4 $8", "&:hover": { bg: "$menuBg" } }}
      align="center"
    >
      <Text variant="sm">{value}</Text>
      {active && <ChatDotIcon css={{ ml: "auto" }} />}
    </Flex>
  );
};

const SelectorHeader = ({ children }) => {
  return (
    <Fragment>
      <HorizontalDivider space={4} />
      <Text variant="md" css={{ p: "$4 $8", fontWeight: "$semiBold" }}>
        {children}
      </Text>
    </Fragment>
  );
};

export const ChatSelector = ({ role, peerId, onSelect }) => {
  const roles = useHMSStore(selectAvailableRoleNames);
  const peers = useHMSStore(selectRemotePeers);
  return (
    <Flex
      direction="column"
      css={{
        size: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        bg: "$bgSecondary",
      }}
    >
      <SelectorItem
        value="Everyone"
        active={!role && !peerId}
        onClick={() => {
          onSelect({ role: "", peerId: "", value: "Everyone" });
        }}
      />
      <SelectorHeader>Roles</SelectorHeader>
      {roles.map(userRole => {
        return (
          <SelectorItem
            value={userRole}
            active={role === userRole}
            onClick={() => {
              onSelect({ role: userRole, value: userRole });
            }}
          />
        );
      })}
      <SelectorHeader>Participants</SelectorHeader>
      {peers.map(peer => {
        return (
          <SelectorItem
            value={peer.name}
            active={peer.id === peerId}
            onClick={() => {
              onSelect({ peerId: peer.id, role: "", value: peer.name });
            }}
          />
        );
      })}
    </Flex>
  );
};
