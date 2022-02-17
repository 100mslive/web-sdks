import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownGroup,
  DropdownLabel,
  Flex,
  Box,
  Text,
  Avatar,
} from "@100mslive/react-ui";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PeopleIcon,
} from "@100mslive/react-icons";
import { useParticipantList } from "../hooks/useParticipantList";

export const ParticipantList = () => {
  const { roles, participantsByRoles, peerCount } = useParticipantList();
  const [open, setOpen] = useState(false);
  return (
    <Dropdown open={open} onOpenChange={value => setOpen(value)}>
      <DropdownTrigger asChild>
        <Flex
          css={{
            color: "$textPrimary",
            "@md": {
              borderRadius: "$1",
              border: "1px solid $textPrimary",
            },
          }}
        >
          <Box css={{ display: "none", "@md": { display: "block", mr: "$2" } }}>
            <PeopleIcon />
          </Box>
          <Text variant="md">{peerCount}</Text>
          <Flex align="center" css={{ "@md": { display: "none" } }}>
            <Text variant="md" css={{ mr: "$2" }}>
              &nbsp;in room
            </Text>
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Flex>
        </Flex>
      </DropdownTrigger>
      <DropdownContent
        sideOffset={5}
        align="end"
        css={{ height: "auto", maxHeight: "$96" }}
      >
        {roles.map(role => {
          if (!participantsByRoles[role]) {
            return null;
          }
          const participants = participantsByRoles[role];
          return (
            <DropdownGroup
              css={{
                h: "auto",
                flexDirection: "column",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
              key={role}
            >
              <DropdownLabel css={{ h: "$14" }}>
                <Text variant="md" css={{ pl: "$8" }}>
                  {role}({participants.length})
                </Text>
              </DropdownLabel>
              {participants.map(peer => {
                return (
                  <DropdownItem key={peer.id} css={{ w: "100%", h: "$14" }}>
                    <Avatar
                      size="tiny"
                      shape="square"
                      name={peer.name}
                      css={{ position: "unset", transform: "unset", mr: "$4" }}
                    />
                    <Text variant="md">{peer.name}</Text>
                  </DropdownItem>
                );
              })}
            </DropdownGroup>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
};
