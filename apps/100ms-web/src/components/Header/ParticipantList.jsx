import React, { Fragment, useState } from "react";
import {
  selectPeerCount,
  selectPeerMetadata,
  selectPermissions,
  useHMSStore,
  useParticipants,
} from "@100mslive/react-sdk";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HandRaiseIcon,
  PeopleIcon,
  SettingIcon,
} from "@100mslive/react-icons";
import {
  Dropdown,
  Flex,
  Box,
  Text,
  Avatar,
  textEllipsis,
  IconButton,
  Tooltip,
} from "@100mslive/react-ui";
import { RoleChangeModal } from "../RoleChangeModal";
import { ConnectionIndicator } from "../Connection/ConnectionIndicator";
import { ParticipantFilter } from "./ParticipantFilter";
import { useSidepaneToggle } from "../AppData/useSidepane";
import { SIDE_PANE_OPTIONS } from "../../common/constants";

export const ParticipantList = () => {
  const [filter, setFilter] = useState();
  const { participants, isConnected, peerCount, rolesWithParticipants } =
    useParticipants(filter);
  const [open, setOpen] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState(null);
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
  if (peerCount === 0) {
    return null;
  }

  return (
    <Fragment>
      <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
        <Dropdown.Trigger asChild data-testid="participant_list">
          <Flex
            css={{
              color: "$textPrimary",
              borderRadius: "$1",
              border: "1px solid $textDisabled",
              padding: "$2 $4",
            }}
          >
            <Tooltip title="Participant List">
              <Flex>
                <ParticipantCount peerCount={peerCount} />
                {participants.length > 0 && (
                  <Box
                    css={{
                      ml: "$2",
                      "@lg": { display: "none" },
                      color: "$textDisabled",
                    }}
                  >
                    {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </Box>
                )}
              </Flex>
            </Tooltip>
          </Flex>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{ w: "$72", height: "auto", maxHeight: "$96" }}
        >
          <Flex
            align="center"
            justify="between"
            css={{ w: "100%", p: "$4 $8" }}
          >
            <Text css={{ flex: "1 1 0", fontWeight: "$semiBold" }}>
              Participants
            </Text>
            <ParticipantFilter
              selection={filter}
              onSelection={setFilter}
              isConnected={isConnected}
              roles={rolesWithParticipants}
            />
          </Flex>
          {participants.length === 0 && (
            <Flex
              align="center"
              justify="center"
              css={{ w: "100%", p: "$8 0" }}
            >
              <Text variant="sm">
                {!filter ? "No participants" : "No matching participants"}
              </Text>
            </Flex>
          )}
          {participants.map(peer => {
            return (
              <Participant
                peer={peer}
                key={peer.id}
                canChangeRole={canChangeRole}
                showActions={isConnected}
                onParticipantAction={setSelectedPeerId}
              />
            );
          })}
        </Dropdown.Content>
      </Dropdown.Root>
      {selectedPeerId && (
        <RoleChangeModal
          peerId={selectedPeerId}
          onOpenChange={value => {
            !value && setSelectedPeerId(null);
          }}
        />
      )}
    </Fragment>
  );
};

export const ParticipantCount = () => {
  const peerCount = useHMSStore(selectPeerCount);
  const toggleSidepane = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  return (
    <IconButton onClick={toggleSidepane}>
      <PeopleIcon />
      {peerCount > 0 && (
        <Flex
          align="center"
          justify="center"
          css={{
            position: "absolute",
            top: 0,
            right: -8,
            zIndex: 2,
            transform: "translateY(-50%)",
            height: "$10",
            minWidth: "$10",
            bg: "$surfaceLight",
            borderRadius: "$4",
            color: "$textPrimary",
            fontSize: "$tiny",
          }}
        >
          {peerCount}
        </Flex>
      )}
    </IconButton>
  );
};

const Participant = ({
  peer,
  canChangeRole,
  showActions,
  onParticipantAction,
}) => {
  return (
    <Dropdown.Item
      key={peer.id}
      css={{ w: "100%", h: "$19" }}
      data-testid={"participant_" + peer.name}
    >
      <Box css={{ width: "$16", flexShrink: 0 }}>
        <Avatar
          name={peer.name}
          css={{
            position: "unset",
            transform: "unset",
            mr: "$4",
            fontSize: "$sm",
          }}
        />
      </Box>
      <Flex direction="column" css={{ flex: "1 1 0" }}>
        <Text
          variant="md"
          css={{ ...textEllipsis(150), fontWeight: "$semiBold" }}
        >
          {peer.name}
        </Text>
        <Text variant="sub2" css={{ color: "$textMedEmp" }}>
          {peer.roleName}
        </Text>
      </Flex>
      {showActions && (
        <ParticipantActions
          peerId={peer.id}
          onSettings={() => {
            onParticipantAction(peer.id);
          }}
          canChangeRole={canChangeRole}
        />
      )}
    </Dropdown.Item>
  );
};

/**
 * shows settings to change for a participant like changing their role
 */
const ParticipantActions = React.memo(
  ({ canChangeRole, onSettings, peerId }) => {
    const isHandRaised = useHMSStore(selectPeerMetadata(peerId))?.isHandRaised;
    return (
      <Flex align="center" css={{ flexShrink: 0 }}>
        <ConnectionIndicator peerId={peerId} />
        {isHandRaised && <HandRaiseIcon />}
        {canChangeRole && (
          <IconButton onClick={onSettings}>
            <SettingIcon />
          </IconButton>
        )}
      </Flex>
    );
  }
);
