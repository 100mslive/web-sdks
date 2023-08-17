import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import {
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerCount,
  selectPeerMetadata,
  selectPeersByCondition,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useParticipants,
} from '@100mslive/react-sdk';
import {
  ChangeRoleIcon,
  HandIcon,
  HandRaiseSlashedIcon,
  MicOffIcon,
  PeopleIcon,
  PeopleRemoveIcon,
  SearchIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Dropdown, Flex, Input, Text, textEllipsis } from '../../..';
import IconButton from '../../IconButton';
import { ChatParticipantHeader } from '../Chat/ChatParticipantHeader';
import { ConnectionIndicator } from '../Connection/ConnectionIndicator';
import { RoleChangeModal } from '../RoleChangeModal';
import { ToastManager } from '../Toast/ToastManager';
import { RoleAccordion } from './RoleAccordion';
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { isInternalRole } from '../../common/utils';
import { LOWER_HAND, SIDE_PANE_OPTIONS } from '../../common/constants';

export const ParticipantList = () => {
  const [filter, setFilter] = useState();
  const { participants, isConnected, peerCount } = useParticipants(filter);
  const peersOrderedByRoles = {};
  const results = { matches: false };

  const handRaisedPeers = useHMSStore(selectPeersByCondition(peer => JSON.parse(peer.metadata || '{}')?.isHandRaised));

  participants.forEach(participant => {
    if (peersOrderedByRoles[participant.roleName] === undefined) {
      peersOrderedByRoles[participant.roleName] = [];
    }
    if (filter?.search && participant.name.includes(filter.search)) {
      results.matches = true;
    }
    peersOrderedByRoles[participant.roleName].push(participant);
  });

  const [selectedPeerId, setSelectedPeerId] = useState(null);
  const onSearch = useCallback(value => {
    setFilter(filterValue => {
      if (!filterValue) {
        filterValue = {};
      }
      filterValue.search = value;
      return { ...filterValue };
    });
  }, []);
  if (peerCount === 0) {
    return null;
  }

  return (
    <Fragment>
      <Flex direction="column" css={{ size: '100%' }}>
        <ChatParticipantHeader activeTabValue={SIDE_PANE_OPTIONS.PARTICIPANTS} />
        {!filter?.search && participants.length === 0 ? null : <ParticipantSearch onSearch={onSearch} inSidePane />}
        {participants.length === 0 || (filter?.search && !results.matches) ? (
          <Flex align="center" justify="center" css={{ w: '100%', p: '$8 0' }}>
            <Text variant="sm">{!filter ? 'No participants' : 'No matching participants'}</Text>
          </Flex>
        ) : null}
        <VirtualizedParticipants
          peersOrderedByRoles={peersOrderedByRoles}
          handRaisedList={handRaisedPeers}
          isConnected={isConnected}
          filter={filter}
          setSelectedPeerId={setSelectedPeerId}
        />
        {selectedPeerId && (
          <RoleChangeModal
            peerId={selectedPeerId}
            onOpenChange={value => {
              !value && setSelectedPeerId(null);
            }}
          />
        )}
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
        {peerCount}
      </Text>
    </IconButton>
  );
};

const VirtualizedParticipants = ({
  peersOrderedByRoles = {},
  isConnected,
  setSelectedPeerId,
  filter,
  handRaisedList = [],
}) => {
  return (
    <Flex
      direction="column"
      css={{
        gap: '$8',
        mt: '$4',
      }}
    >
      <RoleAccordion
        peerList={handRaisedList}
        roleName="Hand Raised"
        filter={filter}
        isConnected={isConnected}
        setSelectedPeerId={setSelectedPeerId}
        isHandRaisedAccordion
      />
      {Object.keys(peersOrderedByRoles).map(role => (
        <RoleAccordion
          key={role}
          peerList={peersOrderedByRoles[role]}
          roleName={role}
          isConnected={isConnected}
          setSelectedPeerId={setSelectedPeerId}
          filter={filter}
        />
      ))}
    </Flex>
  );
};

export const Participant = ({ peer, isConnected, setSelectedPeerId }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  return (
    <Flex
      key={peer.id}
      css={{ w: '100%', p: '$8', pt: '$4', pr: '$6' }}
      align="center"
      justify="between"
      data-testid={'participant_' + peer.name}
    >
      <Text variant="sm" css={{ ...textEllipsis(150), fontWeight: '$semiBold', color: '$on_surface_high' }}>
        {peer.name} {localPeerId === peer.id ? '(You)' : ''}
      </Text>
      {isConnected && peer.id !== localPeerId ? (
        <ParticipantActions
          peerId={peer.id}
          role={peer.roleName}
          onSettings={() => {
            setSelectedPeerId(peer.id);
          }}
        />
      ) : null}
    </Flex>
  );
};

/**
 * shows settings to change for a participant like changing their role
 */
const ParticipantActions = React.memo(({ onSettings, peerId, role }) => {
  const isHandRaised = useHMSStore(selectPeerMetadata(peerId))?.isHandRaised;
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
  const shouldShowMoreActions = canChangeRole;
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));

  return (
    <Flex align="center" css={{ flexShrink: 0, gap: '$8', mt: '$2' }}>
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
          css={{ p: '$1', c: '$on_surface_high', bg: '$surface_bright', borderRadius: '$round' }}
        >
          <MicOffIcon height={19} width={19} />
        </Flex>
      ) : null}

      {shouldShowMoreActions && !isInternalRole(role) && (
        <ParticipantMoreActions onRoleChange={onSettings} peerId={peerId} role={role} isHandRaised={isHandRaised} />
      )}
    </Flex>
  );
});

const ParticipantMoreActions = ({ onRoleChange, peerId, isHandRaised }) => {
  const hmsActions = useHMSActions();
  const { changeRole: canChangeRole, removeOthers: canRemoveOthers } = useHMSStore(selectPermissions);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const isLocal = localPeerId === peerId;
  const actions = useHMSActions();
  const [open, setOpen] = useState(false);

  const lowerHand = async () => {
    await hmsActions.sendDirectMessage('Lower hand', peerId, LOWER_HAND);
  };

  return (
    <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
      <Dropdown.Trigger
        asChild
        data-testid="participant_more_actions"
        css={{ p: '$1', r: '$0', c: '$on_surface_high' }}
        tabIndex={0}
      >
        <Flex>
          <VerticalMenuIcon />
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={8} css={{ w: '$64', bg: '$surface_default' }}>
          {canChangeRole && (
            <Dropdown.Item css={{ bg: '$surface_default' }} onClick={() => onRoleChange(peerId)}>
              <ChangeRoleIcon />
              <Text variant="sm" css={{ ml: '$4', fontWeight: '$semiBold', c: '$on_surface_high' }}>
                Change Role
              </Text>
            </Dropdown.Item>
          )}
          {isHandRaised ? (
            <Dropdown.Item css={{ c: '$on_surface_high', bg: '$surface_default' }} onClick={lowerHand}>
              <HandRaiseSlashedIcon />
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                Lower Hand
              </Text>
            </Dropdown.Item>
          ) : null}

          {!isLocal && canRemoveOthers && (
            <Dropdown.Item
              css={{ color: '$alert_error_default', bg: '$surface_default' }}
              onClick={async () => {
                try {
                  await actions.removePeer(peerId, '');
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
      css={{ p: '$2 0', mb: '$2', position: 'relative', color: '$on_surface_medium', mt: inSidePane ? '$4' : '' }}
    >
      <SearchIcon style={{ position: 'absolute', left: '0.5rem' }} />
      <Input
        type="text"
        placeholder={placeholder || 'Search for participants'}
        css={{ w: '100%', pl: '$14', bg: inSidePane ? '$surface_default' : '$surface_dim' }}
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
