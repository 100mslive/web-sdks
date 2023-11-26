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
import { useFilteredRoles } from '../../common/hooks';

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

const Everyone = React.memo(
  ({
    onSelect,
    active,
  }: {
    active: boolean;
    onSelect: ({ role, peerId, selection }: { role: string; peerId: string; selection: string }) => void;
  }) => {
    const unreadCount = useHMSStore(selectUnreadHMSBroadcastMessagesCount);
    return (
      <SelectorItem
        value="Everyone"
        active={active}
        unreadCount={unreadCount}
        onClick={() => {
          onSelect({ role: '', peerId: '', selection: 'Everyone' });
        }}
      />
    );
  },
);

const RoleItem = React.memo(
  ({
    onSelect,
    role,
    active,
  }: {
    role: string;
    active: boolean;
    onSelect: ({ role, peerId, selection }: { role: string; peerId: string; selection: string }) => void;
  }) => {
    const unreadCount = useHMSStore(selectMessagesUnreadCountByRole(role));
    return (
      <SelectorItem
        value={role}
        active={active}
        unreadCount={unreadCount}
        onClick={() => {
          onSelect({ role: role, peerId: '', selection: role });
        }}
      />
    );
  },
);

const PeerItem = ({
  onSelect,
  peerId,
  name,
  active,
}: {
  name: string;
  peerId: string;
  active: boolean;
  onSelect: ({ role, peerId, selection }: { role: any; peerId: string; selection: string }) => void;
}) => {
  const unreadCount = useHMSStore(selectMessagesUnreadCountByPeerID(peerId));
  return (
    <SelectorItem
      value={name}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        onSelect({ role: '', peerId, selection: name });
      }}
    />
  );
};

const VirtualizedSelectItemList = ({
  peers,
  selectedRole,
  selectedPeerId,
  searchValue,
  public_chat_enabled,
  onSelect,
}: {
  peers: HMSPeer[];
  selectedRole: string;
  selectedPeerId: string;
  searchValue: string;
  public_chat_enabled: boolean;
  onSelect: ({ role, peerId, selection }: { role: string; peerId: string; selection: string }) => void;
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
    const selectItems = public_chat_enabled
      ? [<Everyone onSelect={onSelect} active={!selectedRole && !selectedPeerId} />]
      : [];

    roles.length > 0 &&
      selectItems.push(<SelectorHeader isHorizontalDivider={public_chat_enabled}>Roles</SelectorHeader>);
    roles.forEach(userRole =>
      selectItems.push(
        <RoleItem key={userRole} active={selectedRole === userRole} role={userRole} onSelect={onSelect} />,
      ),
    );

    filteredPeers.length > 0 &&
      selectItems.push(
        <SelectorHeader isHorizontalDivider={public_chat_enabled || roles.length > 0}>Participants</SelectorHeader>,
      );
    filteredPeers.forEach(peer =>
      selectItems.push(
        <PeerItem
          key={peer.id}
          name={peer.name}
          peerId={peer.id}
          active={peer.id === selectedPeerId}
          onSelect={onSelect}
        />,
      ),
    );

    return selectItems;
  }, [public_chat_enabled, onSelect, selectedRole, selectedPeerId, roles, filteredPeers]);

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

export const ChatSelector = ({
  role,
  peerId,
  onSelect,
}: {
  role: string;
  peerId: string;
  onSelect: ({ role, peerId, selection }: { role: any; peerId: string; selection: string }) => void;
}) => {
  const { elements } = useRoomLayoutConferencingScreen();
  const peers = useHMSStore(selectRemotePeers);
  const [search, setSearch] = useState('');

  const private_chat_enabled = !!elements?.chat?.private_chat_enabled;
  const public_chat_enabled = !!elements?.chat?.public_chat_enabled;

  return (
    <>
      {peers.length > 0 && private_chat_enabled && (
        <Box css={{ px: '$4' }}>
          <ParticipantSearch onSearch={setSearch} placeholder="Search for participants" />
        </Box>
      )}
      <VirtualizedSelectItemList
        selectedRole={role}
        selectedPeerId={peerId}
        onSelect={onSelect}
        peers={private_chat_enabled ? peers : []}
        public_chat_enabled={public_chat_enabled}
        searchValue={search}
      />
    </>
  );
};
