import { memo, ReactNode, useMemo, useState } from 'react';
import { useMedia } from 'react-use';
import {
  HMSPeer,
  HMSPeerType,
  selectMessagesUnreadCountByPeerID,
  selectMessagesUnreadCountByRole,
  selectRemotePeers,
  selectUnreadHMSMessagesCount,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CheckIcon, PeopleIcon } from '@100mslive/react-icons';
import { Box, CSS, Dropdown, Flex, HorizontalDivider, Text, Tooltip } from '../../..';
import { config as cssConfig } from '../../../Theme';
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
  icon = undefined,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  unreadCount: number;
  icon?: ReactNode;
}) => {
  const isMobile = useMedia(cssConfig.media.md);

  const Root = !isMobile
    ? Dropdown.Item
    : ({ children, ...rest }: { children: ReactNode; css: CSS }) => (
        <Flex {...rest} css={{ p: '$6 $8', ...rest.css }}>
          {children}
        </Flex>
      );
  return (
    <Root
      data-testid="chat_members"
      css={{ align: 'center', px: '$10', py: '$4', bg: '$surface_default' }}
      onClick={onClick}
    >
      <Text
        variant="sm"
        css={{ display: 'flex', alignItems: 'center', gap: '$4', fontWeight: '$semiBold', color: '$on_surface_high' }}
      >
        {icon}
        {value}
      </Text>
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
    </Root>
  );
};

const SelectorHeader = memo(
  ({ isHorizontalDivider = true, children }: { isHorizontalDivider?: boolean; children: ReactNode }) => {
    return (
      <Box css={{ flexShrink: 0 }}>
        {isHorizontalDivider && <HorizontalDivider space={4} />}
        <Text
          variant="overline"
          css={{ p: '$4 $10', fontWeight: '$semiBold', textTransform: 'uppercase', color: '$on_surface_medium' }}
        >
          {children}
        </Text>
      </Box>
    );
  },
);

const Everyone = memo(({ active }: { active: boolean }) => {
  const unreadCount: number = useHMSStore(selectUnreadHMSMessagesCount);
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  return (
    <SelectorItem
      value="Everyone"
      icon={<PeopleIcon />}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector({});
        setRoleSelector('');
      }}
    />
  );
});

const RoleItem = memo(({ role, active }: { role: string; active: boolean }) => {
  const unreadCount: number = useHMSStore(selectMessagesUnreadCountByRole(role));
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);
  return (
    <SelectorItem
      value={role}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector({});
        setRoleSelector(role);
      }}
    />
  );
});

const PeerItem = ({ peerId, name, active }: { name: string; peerId: string; active: boolean }) => {
  const unreadCount: number = useHMSStore(selectMessagesUnreadCountByPeerID(peerId));
  const [, setPeerSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.PEER);
  const [, setRoleSelector] = useSetSubscribedChatSelector(CHAT_SELECTOR.ROLE);

  return (
    <SelectorItem
      value={name}
      active={active}
      unreadCount={unreadCount}
      onClick={() => {
        setPeerSelector({ id: peerId, name });
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
        peer =>
          (!searchValue || peer.name.toLowerCase().includes(searchValue.toLowerCase())) &&
          peer.type !== HMSPeerType.SIP,
      ),
    [peers, searchValue],
  );

  const listItems = useMemo(() => {
    let selectItems: ReactNode[] = [];
    if (isPublicChatEnabled && !searchValue) {
      selectItems = [<Everyone active={!selectedRole && !selectedPeerId} />];
    }
    if (roles.length > 0 && !searchValue) {
      selectItems.push(<SelectorHeader isHorizontalDivider={isPublicChatEnabled}>Roles</SelectorHeader>);
      roles.forEach(userRole =>
        selectItems.push(<RoleItem key={userRole} active={selectedRole === userRole} role={userRole} />),
      );
    }

    if (filteredPeers.length > 0) {
      selectItems.push(
        <SelectorHeader isHorizontalDivider={isPublicChatEnabled || roles.length > 0}>Participants</SelectorHeader>,
      );
    }
    filteredPeers.forEach(peer =>
      selectItems.push(
        <PeerItem key={peer.id} name={peer.name} peerId={peer.id} active={peer.id === selectedPeerId} />,
      ),
    );

    return selectItems;
  }, [isPublicChatEnabled, searchValue, selectedRole, selectedPeerId, roles, filteredPeers]);

  return (
    <Dropdown.Group css={{ overflowY: 'auto', maxHeight: '$64', bg: '$surface_default' }}>
      {listItems.map((item, index) => (
        <Box key={index}>{item}</Box>
      ))}
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
