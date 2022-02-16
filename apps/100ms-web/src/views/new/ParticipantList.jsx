import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  Flex,
  Text,
  Avatar,
} from "@100mslive/react-ui";
import { ChevronDownIcon } from "@100mslive/react-icons";
import { useParticipantList } from "../hooks/useParticipantList";

export const ParticipantList = () => {
  const { roles, participantsByRoles, peerCount } = useParticipantList();
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Flex css={{ color: "$textPrimary" }}>
          <Text variant="md">{peerCount}</Text>
          <Text variant="md" css={{ mx: "$2", "@md": { display: "none" } }}>
            in room
          </Text>
          <ChevronDownIcon />
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
            <DropdownItem
              css={{
                h: "auto",
                flexDirection: "column",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <Text variant="md" css={{ mb: "$8" }}>
                {role}({participants.length})
              </Text>
              {participants.map(peer => {
                return (
                  <Flex
                    key={peer.id}
                    align="center"
                    css={{ w: "100%", h: "$14" }}
                  >
                    <Avatar
                      size="tiny"
                      shape="square"
                      name={peer.name}
                      css={{ position: "unset", transform: "unset", mr: "$4" }}
                    />
                    <Text variant="md">{peer.name}</Text>
                  </Flex>
                );
              })}
            </DropdownItem>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
};
