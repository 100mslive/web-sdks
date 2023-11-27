import React, { useMemo, useState } from 'react';
import {
  HMSPeer,
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  selectRemotePeers,
  selectUnreadHMSBroadcastMessagesCount,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CheckIcon } from '@100mslive/react-icons';
import { Box, Dropdown, Flex, HorizontalDivider, Text, Tooltip } from '../../..';
// @ts-ignore
import { ParticipantSearch } from '../Footer/ParticipantList';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSetSubscribedChatSelector } from '../AppData/useUISettings';
import { useFilteredRoles } from '../../common/hooks';
import { CHAT_SELECTOR } from '../../common/constants';

const ChatDotIcon = () => {
  return <Box css={{ size: '$6', bg: '$primary_default', mx: '$2', r: '$round' }} />;
};

const SelectorItem = ({
  value,
  active,
  onClick,
  unreadCount,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  unreadCount: number;
}) => {
  return (
    <Dropdown.Item
      data-testid="chat_members"
      css={{ align: 'center', px: '$10', bg: '$surface_default' }}
      onClick={onClick}
    >
      <Text variant="sm">{value}</Text>
      <Flex align="center" css={{ ml: 'auto', color: '$on_primary_high' }}>
        {unreadCount > 0 && (
          <Tooltip title={`${unreadCount} unread`}>
            <Box css={{ mr: active ? '$3' : 0 }}>
              <ChatDotIcon />
            </Box>
          </Tooltip>
        )}
        {active && <CheckIcon width={16} height={16} />}
      </Flex>
    </Dropdown.Item>
  );
};

const SelectorHeader = React.memo(
  ({ isHorizontalDivider, children }: { isHorizontalDivider: boolean; children: React.ReactNode }) => {
    return (
      <Box css={{ flexShrink: 0 }}>
        {isHorizontalDivider && <HorizontalDivider space={4} />}
        <Text variant="overline" css={{ p: '$4 $10', fontWeight: '$semiBold', textTransform: 'uppercase' }}>
          {children}
        </Text>
      </Box>
    );
  },
);

const Everyone = React.memo(({ active }: { active: boolean }) => {
  const unreadCount = useHMSStore(selectUnreadHMSBroadcastMessagesCount);
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER_ID);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  return (
    <SelectorItem
      value="Everyone"
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector('');
        setRoleSelector('');
      }}
    />
  );
});

const RoleItem = React.memo(({ role, active }: { role: string; active: boolean }) => {
  const unreadCount = useHMSStore(selectMessagesUnreadCountByRole(role));
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER_ID);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  return (
    <SelectorItem
      value={role}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector('');
        setRoleSelector(role);
      }}
    />
  );
});

const PeerItem = ({ peerId, name, active }: { name: string; peerId: string; active: boolean }) => {
  const unreadCount = useHMSStore(selectMessagesUnreadCountByPeerID(peerId));
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER_ID);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);

  return (
    <SelectorItem
      value={name}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector(peerId);
        setRoleSelector('');
      }}
    />
  );
};

const VirtualizedSelectItemList = ({
  peers,
  selectedRole,
  selectedPeerId,
  searchValue,
  isPublicChatEnabled,
}: {
  peers: HMSPeer[];
  selectedRole: string;
  selectedPeerId: string;
  searchValue: string;
  isPublicChatEnabled: boolean;
}) => {
  const roles = useFilteredRoles();
  const filteredPeers = useMemo(
    () =>
      peers.filter(
        // search should be empty or search phrase should be included in name
        peer => !searchValue || peer.name.toLowerCase().includes(searchValue.toLowerCase()),
      ),
    [peers, searchValue],
  );

  const listItems = useMemo(() => {
    const selectItems = isPublicChatEnabled ? [<Everyone active={!selectedRole && !selectedPeerId} />] : [];

    roles.length > 0 &&
      selectItems.push(<SelectorHeader isHorizontalDivider={isPublicChatEnabled}>Roles</SelectorHeader>);
    roles.forEach(userRole =>
      selectItems.push(<RoleItem key={userRole} active={selectedRole === userRole} role={userRole} />),
    );

    filteredPeers.length > 0 &&
      selectItems.push(
        <SelectorHeader isHorizontalDivider={isPublicChatEnabled || roles.length > 0}>Participants</SelectorHeader>,
      );
    filteredPeers.forEach(peer =>
      selectItems.push(
        <PeerItem key={peer.id} name={peer.name} peerId={peer.id} active={peer.id === selectedPeerId} />,
      ),
    );

    return selectItems;
  }, [isPublicChatEnabled, selectedRole, selectedPeerId, roles, filteredPeers]);

  return (
    <Dropdown.Group css={{ overflowY: 'auto', maxHeight: '$64', bg: '$surface_default' }}>
      <Box>
        {listItems.map((item, index) => (
          <Box key={index}>{item}</Box>
        ))}
      </Box>
    </Dropdown.Group>
  );
};

export const ChatSelector = ({ role, peerId }: { role: string; peerId: string }) => {
  const { elements } = useRoomLayoutConferencingScreen();
  const peers = useHMSStore(selectRemotePeers);
  const [search, setSearch] = useState('');

  const isPrivateChatEnabled = !!elements?.chat?.private_chat_enabled;
  const isPublicChatEnabled = !!elements?.chat?.public_chat_enabled;

  return (
    <>
      {peers.length > 0 && isPrivateChatEnabled && (
        <Box css={{ px: '$4' }}>
          <ParticipantSearch onSearch={setSearch} placeholder="Search for participants" />
        </Box>
      )}
      <VirtualizedSelectItemList
        selectedRole={role}
        selectedPeerId={peerId}
        peers={isPrivateChatEnabled ? peers : []}
        isPublicChatEnabled={isPublicChatEnabled}
        searchValue={search}
      />
    </>
  );
};
