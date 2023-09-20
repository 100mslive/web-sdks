import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDebounce, useMedia } from 'react-use';
import {
  selectHandRaisedPeers,
  selectHasPeerHandRaised,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerCount,
  selectPeerMetadata,
  selectPermissions,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  ChangeRoleIcon,
  HandIcon,
  MicOffIcon,
  PeopleIcon,
  PeopleRemoveIcon,
  SearchIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Box, config as cssConfig, Dropdown, Flex, Input, Text, textEllipsis } from '../../..';
import IconButton from '../../IconButton';
import { ConnectionIndicator } from '../Connection/ConnectionIndicator';
import { ToastManager } from '../Toast/ToastManager';
import { RoleAccordion } from './RoleAccordion';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { useParticipants } from '../../common/hooks';
import { getFormattedCount } from '../../common/utils';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const ParticipantList = () => {
  const [filter, setFilter] = useState();
  const { participants, isConnected, peerCount } = useParticipants(filter);
  const peersOrderedByRoles = {};

  const handRaisedPeers = useHMSStore(selectHandRaisedPeers);

  participants.forEach(participant => {
    if (peersOrderedByRoles[participant.roleName] === undefined) {
      peersOrderedByRoles[participant.roleName] = [];
    }
    peersOrderedByRoles[participant.roleName].push(participant);
  });

  const onSearch = useCallback(value => {
    setFilter(filterValue => {
      if (!filterValue) {
        filterValue = {};
      }
      filterValue.search = value.toLowerCase();
      return { ...filterValue };
    });
  }, []);
  if (peerCount === 0) {
    return null;
  }

  return (
    <Fragment>
      <Flex direction="column" css={{ size: '100%', gap: '$4' }}>
        {!filter?.search && participants.length === 0 ? null : <ParticipantSearch onSearch={onSearch} inSidePane />}
        {participants.length === 0 ? (
          <Flex align="center" justify="center" css={{ w: '100%', p: '$8 0' }}>
            <Text variant="sm">{!filter ? 'No participants' : 'No matching participants'}</Text>
          </Flex>
        ) : null}
        <VirtualizedParticipants
          peersOrderedByRoles={peersOrderedByRoles}
          handRaisedList={handRaisedPeers}
          isConnected={isConnected}
          filter={filter}
        />
      </Flex>
    </Fragment>
  );
};

export const ParticipantCount = () => {
  const peerCount = useHMSStore(selectPeerCount);
  const toggleSidepane = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const isParticipantsOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.PARTICIPANTS);
  useEffect(() => {
    if (isParticipantsOpen && peerCount === 0) {
      toggleSidepane();
    }
  }, [isParticipantsOpen, peerCount, toggleSidepane]);

  if (peerCount === 0) {
    return null;
  }
  return (
    <IconButton
      css={{
        w: 'auto',
        p: '$4',
        h: 'auto',
      }}
      onClick={() => {
        if (peerCount > 0) {
          toggleSidepane();
        }
      }}
      active={!isParticipantsOpen}
      data-testid="participant_list"
    >
      <PeopleIcon />
      <Text variant="sm" css={{ mx: '$4', c: 'inherit' }}>
        {getFormattedCount(peerCount)}
      </Text>
    </IconButton>
  );
};

const VirtualizedParticipants = ({ peersOrderedByRoles = {}, isConnected, filter, handRaisedList = [] }) => {
  return (
    <Flex
      direction="column"
      css={{
        gap: '$8',
        overflowY: 'auto',
        overflowX: 'hidden',
        pr: '$10',
        mr: '-$10',
        flex: '1 1 0',
      }}
    >
      {handRaisedList.length > 0 ? (
        <RoleAccordion
          peerList={handRaisedList}
          roleName="Hand Raised"
          filter={filter}
          isConnected={isConnected}
          isHandRaisedAccordion
        />
      ) : null}
      {Object.keys(peersOrderedByRoles).map(role => (
        <RoleAccordion
          key={role}
          peerList={peersOrderedByRoles[role]}
          roleName={role}
          isConnected={isConnected}
          filter={filter}
        />
      ))}
    </Flex>
  );
};

export const Participant = ({ peer, isConnected }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  return (
    <Flex
      key={peer.id}
      css={{
        w: '100%',
        p: '$4 $8',
        pr: '$6',
        h: '$16',
        '&:hover .participant_item': { display: 'flex' },
      }}
      align="center"
      justify="between"
      data-testid={'participant_' + peer.name}
    >
      <Text variant="sm" css={{ ...textEllipsis(150), fontWeight: '$semiBold', color: '$on_surface_high' }}>
        {peer.name} {localPeerId === peer.id ? '(You)' : ''}
      </Text>
      {isConnected ? (
        <ParticipantActions peerId={peer.id} isLocal={peer.id === localPeerId} role={peer.roleName} />
      ) : null}
    </Flex>
  );
};

/**
 * shows settings to change for a participant like changing their role
 */
const ParticipantActions = React.memo(({ peerId, role, isLocal }) => {
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(peerId));
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
  const shouldShowMoreActions = canChangeRole;
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));

  return (
    <Flex
      align="center"
      css={{
        flexShrink: 0,
        gap: '$8',
      }}
    >
      <ConnectionIndicator peerId={peerId} />
      {isHandRaised && (
        <Flex
          align="center"
          justify="center"
          css={{ p: '$1', c: '$on_surface_high', bg: '$surface_bright', borderRadius: '$round' }}
        >
          <HandIcon height={19} width={19} />
        </Flex>
      )}
      {isAudioMuted ? (
        <Flex
          align="center"
          justify="center"
          css={{ p: '$2', c: '$on_surface_high', bg: '$surface_bright', borderRadius: '$round' }}
        >
          <MicOffIcon height={19} width={19} />
        </Flex>
      ) : null}

      {shouldShowMoreActions && !isLocal ? <ParticipantMoreActions peerId={peerId} role={role} /> : null}
    </Flex>
  );
});

const ParticipantMoreActions = ({ peerId, role }) => {
  const hmsActions = useHMSActions();
  const { changeRole: canChangeRole, removeOthers: canRemoveOthers } = useHMSStore(selectPermissions);
  const { elements } = useRoomLayoutConferencingScreen();
  const {
    bring_to_stage_label,
    remove_from_stage_label,
    on_stage_role,
    off_stage_roles = [],
  } = elements.on_stage_exp || {};
  const isInStage = role === on_stage_role;
  const shouldShowStageRoleChange =
    canChangeRole &&
    ((isInStage && remove_from_stage_label) || (off_stage_roles?.includes(role) && bring_to_stage_label));
  const prevRole = useHMSStore(selectPeerMetadata(peerId))?.prevRole;
  const localPeerId = useHMSStore(selectLocalPeerID);
  const isLocal = localPeerId === peerId;
  const [open, setOpen] = useState(false);

  const handleStageAction = async () => {
    if (isInStage) {
      prevRole && hmsActions.changeRoleOfPeer(peerId, prevRole, true);
    } else {
      await hmsActions.changeRoleOfPeer(peerId, on_stage_role);
    }
    setOpen(false);
  };

  return (
    <Dropdown.Root open={open} onOpenChange={value => setOpen(value)} modal={false}>
      <Dropdown.Trigger
        asChild
        data-testid="participant_more_actions"
        className="participant_item"
        css={{
          p: '$1',
          r: '$0',
          c: '$on_surface_high',
          display: open ? 'flex' : 'none',
          '&:hover': {
            bg: '$surface_bright',
          },
          '@md': {
            display: 'flex',
          },
        }}
        tabIndex={0}
      >
        <Box css={{ my: 'auto' }}>
          <VerticalMenuIcon />
        </Box>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={8} css={{ w: '$64', bg: '$surface_default' }}>
          {shouldShowStageRoleChange ? (
            <Dropdown.Item css={{ bg: '$surface_default' }} onClick={() => handleStageAction()}>
              <ChangeRoleIcon />
              <Text variant="sm" css={{ ml: '$4', fontWeight: '$semiBold', c: '$on_surface_high' }}>
                {isInStage ? remove_from_stage_label : bring_to_stage_label}
              </Text>
            </Dropdown.Item>
          ) : null}

          {!isLocal && canRemoveOthers && (
            <Dropdown.Item
              css={{ color: '$alert_error_default', bg: '$surface_default' }}
              onClick={async () => {
                try {
                  await hmsActions.removePeer(peerId, '');
                } catch (error) {
                  ToastManager.addToast({ title: error.message, variant: 'error' });
                }
              }}
            >
              <PeopleRemoveIcon />
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                Remove Participant
              </Text>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};

export const ParticipantSearch = ({ onSearch, placeholder, inSidePane = false }) => {
  const [value, setValue] = React.useState('');
  const isMobile = useMedia(cssConfig.media.md);

  useDebounce(
    () => {
      onSearch(value);
    },
    300,
    [value, onSearch],
  );
  return (
    <Flex
      align="center"
      css={{
        p: isMobile ? '0' : '$2 0',
        mb: '$2',
        position: 'relative',
        color: '$on_surface_medium',
        mt: inSidePane ? '$4' : '',
      }}
    >
      <SearchIcon style={{ position: 'absolute', left: isMobile ? '1.25rem' : '0.5rem' }} />
      <Input
        type="text"
        placeholder={placeholder || 'Search for participants'}
        css={{ w: '100%', p: '$6', pl: '$14', mr: '$4', bg: inSidePane ? '$surface_default' : '$surface_dim' }}
        value={value}
        onKeyDown={event => {
          event.stopPropagation();
        }}
        onChange={event => {
          setValue(event.currentTarget.value);
        }}
        autoComplete="off"
        aria-autocomplete="none"
      />
    </Flex>
  );
};
