import React, { Fragment, useState } from "react";
import {
  selectAvailableRoleNames,
  selectRemotePeers,
  useHMSStore,
  selectUnreadHMSMessagesCount,
  selectMessagesUnreadCountByRole,
  selectMessagesUnreadCountByPeerID,
} from "@100mslive/react-sdk";
import {
  Box,
  Dropdown,
  Flex,
  HorizontalDivider,
  IconButton,
  Input,
  Text,
  Tooltip,
} from "@100mslive/react-ui";
import { CheckIcon, CrossIcon } from "@100mslive/react-icons";
import { ChatDotIcon } from "./ChatDotIcon";

const SelectorItem = ({ value, active, onClick, unreadCount }) => {
  return (
    <Dropdown.Item
      data-testid="chat_members"
      css={{ align: "center", px: "$10" }}
      onClick={onClick}
    >
      <Text variant="sm">{value}</Text>
      <Flex align="center" css={{ ml: "auto", color: "$textPrimary" }}>
        {unreadCount > 0 && (
          <Tooltip title={`${unreadCount} unread`}>
            <Box css={{ mr: active ? "$3" : 0 }}>
              <ChatDotIcon />
            </Box>
          </Tooltip>
        )}
        {active && <CheckIcon width={16} height={16} />}
      </Flex>
    </Dropdown.Item>
  );
};

const SelectorHeader = React.memo(({ children }) => {
  return (
    <Box css={{ flexShrink: 0 }}>
      <HorizontalDivider space={4} />
      <Text variant="md" css={{ p: "$4 $10", fontWeight: "$semiBold" }}>
        {children}
      </Text>
    </Box>
  );
});

const Everyone = React.memo(({ onSelect, active }) => {
  const unreadCount = useHMSStore(selectUnreadHMSMessagesCount);
  return (
    <SelectorItem
      value="Everyone"
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        onSelect({ role: "", peerId: "", selection: "Everyone" });
      }}
    />
  );
});

const RoleItem = React.memo(({ onSelect, role, active }) => {
  const unreadCount = useHMSStore(selectMessagesUnreadCountByRole(role));
  return (
    <SelectorItem
      value={role}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        onSelect({ role: role, selection: role });
      }}
    />
  );
});

const PeerItem = ({ onSelect, peerId, name, active }) => {
  const unreadCount = useHMSStore(selectMessagesUnreadCountByPeerID(peerId));
  return (
    <SelectorItem
      value={name}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        onSelect({ role: "", peerId, selection: name });
      }}
    />
  );
};

export const ChatSelector = ({ role, peerId, onSelect }) => {
  const roles = useHMSStore(selectAvailableRoleNames);
  const peers = useHMSStore(selectRemotePeers);
  const [search, setSearch] = useState("");
  return (
    <Fragment>
      {peers.length > 0 && (
        <Box css={{ px: "$8", position: "relative" }}>
          <Input
            type="text"
            autoCorrect="off"
            autoComplete="name"
            value={search}
            placeholder="Search Participants"
            css={{
              bg: "$menuBg",
              w: "100%",
              pr: "$12",
              "$:focus": { boxShadow: "none", outline: "none" },
            }}
            onChange={e => {
              setSearch(e.target.value);
            }}
          />
          <Flex
            align="center"
            css={{
              position: "absolute",
              right: "$10",
              top: 0,
              height: "100%",
            }}
          >
            <IconButton onClick={() => setSearch("")}>
              <CrossIcon width={18} height={18} />
            </IconButton>
          </Flex>
        </Box>
      )}
      <Dropdown.Group css={{ maxHeight: "$64", overflowY: "auto" }}>
        <Everyone onSelect={onSelect} active={!role && !peerId} />
        {roles.length > 0 && <SelectorHeader>Roles</SelectorHeader>}
        {roles.map(userRole => {
          return (
            <RoleItem
              key={userRole}
              active={role === userRole}
              role={userRole}
              onSelect={onSelect}
            />
          );
        })}
        {peers.length > 0 && <SelectorHeader>Participants</SelectorHeader>}
        {peers
          .filter(peer => !search || peer.name.toLowerCase().includes(search))
          .map(peer => {
            return (
              <PeerItem
                key={peer.id}
                name={peer.name}
                peerId={peer.id}
                active={peer.id === peerId}
                onSelect={onSelect}
              />
            );
          })}
      </Dropdown.Group>
    </Fragment>
  );
};
