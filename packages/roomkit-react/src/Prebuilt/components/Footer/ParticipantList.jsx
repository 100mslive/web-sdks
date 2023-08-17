import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectLocalPeerID,
  selectPeerCount,
  selectPeerMetadata,
  selectPermissions,
  selectIsPeerAudioEnabled,
  useHMSActions,
  useHMSStore,
  useParticipants,
} from '@100mslive/react-sdk';
import {
  ChangeRoleIcon,
  HandIcon,
  MicOffIcon,
  PeopleIcon,
  RemoveUserIcon,
  SearchIcon,
  SpeakerIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Box, Dropdown, Flex, Input, Slider, Text, textEllipsis } from '../../..';
import IconButton from '../../IconButton';
import { ChatParticipantHeader } from '../Chat/ChatParticipantHeader';
import { ConnectionIndicator } from '../Connection/ConnectionIndicator';
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { isInternalRole } from '../../common/utils';
import { SIDE_PANE_OPTIONS } from '../../common/constants';
import { RoleAccordion } from './RoleAccordion';

export const ParticipantList = () => {
  const [filter, setFilter] = useState();
  const { participants, isConnected, peerCount } = useParticipants(filter);
  const peersOrderedByRoles = {};
  participants.forEach(participant => {
    if (peersOrderedByRoles[participant.roleName] === undefined) {
      peersOrderedByRoles[participant.roleName] = [];
    }
    peersOrderedByRoles[participant.roleName].push(participant);
  });
  // Can use to mute/unmute etc
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
        {participants.length === 0 && (
          <Flex align="center" justify="center" css={{ w: '100%', p: '$8 0' }}>
            <Text variant="sm">{!filter ? 'No participants' : 'No matching participants'}</Text>
          </Flex>
        )}
        <VirtualizedParticipants
          peersOrderedByRoles={peersOrderedByRoles}
          isConnected={isConnected}
          setSelectedPeerId={setSelectedPeerId}
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
        {peerCount}
      </Text>
    </IconButton>
  );
};

function itemKey(index, data) {
  return data.participants[index].id;
}

const VirtualizedParticipants = ({ peersOrderedByRoles = {}, isConnected, setSelectedPeerId }) => {
  return (
    <Box
      css={{
        flex: '1 1 0',
      }}
    >
      {Object.keys(peersOrderedByRoles).map(role => (
        <RoleAccordion
          peerList={peersOrderedByRoles[role]}
          roleName={role}
          isConnected={isConnected}
          setSelectedPeerId={setSelectedPeerId}
        />
      ))}
    </Box>
  );
};

const VirtualisedParticipantListItem = React.memo(({ style, index, data }) => {
  return (
    <div style={style} key={data.participants[index].id}>
      <Participant
        peer={data.participants[index]}
        isConnected={data.isConnected}
        setSelectedPeerId={data.setSelectedPeerId}
      />
    </div>
  );
});

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
      {isConnected && (
        <ParticipantActions
          peerId={peer.id}
          role={peer.roleName}
          onSettings={() => {
            setSelectedPeerId(peer.id);
          }}
        />
      )}
    </Flex>
  );
};

/**
 * shows settings to change for a participant like changing their role
 */
const ParticipantActions = React.memo(({ onSettings, peerId, role }) => {
  const isHandRaised = useHMSStore(selectPeerMetadata(peerId))?.isHandRaised;
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const localPeerId = useHMSStore(selectLocalPeerID);
  const canChangeVolume = peerId !== localPeerId && audioTrack;
  const shouldShowMoreActions = canChangeRole || canChangeVolume;
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
        <ParticipantMoreActions onRoleChange={onSettings} peerId={peerId} role={role} />
      )}
    </Flex>
  );
});

const ParticipantMoreActions = ({ onRoleChange, peerId }) => {
  const { changeRole: canChangeRole, removeOthers: canRemoveOthers } = useHMSStore(selectPermissions);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const isLocal = localPeerId === peerId;
  const actions = useHMSActions();
  const [open, setOpen] = useState(false);
  return (
    <Dropdown.Root open={open} onOpenChange={value => setOpen(value)}>
      <Dropdown.Trigger
        asChild
        data-testid="participant_more_actions"
        css={{ p: '$1', r: '$0', c: '$on_surface_high' }}
        tabIndex={0}
      >
        <VerticalMenuIcon />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={8} css={{ w: '$64' }}>
          {canChangeRole && (
            <Dropdown.Item onClick={() => onRoleChange(peerId)}>
              <ChangeRoleIcon />
              <Text css={{ ml: '$4' }}>Change Role</Text>
            </Dropdown.Item>
          )}
          <ParticipantVolume peerId={peerId} />
          {!isLocal && canRemoveOthers && (
            <Dropdown.Item
              onClick={async () => {
                try {
                  await actions.removePeer(peerId, '');
                } catch (error) {
                  // TODO: Toast here
                }
              }}
            >
              <RemoveUserIcon />
              <Text css={{ ml: '$4', color: '$alert_error_default' }}>Remove Participant</Text>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};

const ParticipantVolume = ({ peerId }) => {
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const localPeerId = useHMSStore(selectLocalPeerID);
  const hmsActions = useHMSActions();
  // No volume control for local peer or non audio publishing role
  if (peerId === localPeerId || !audioTrack) {
    return null;
  }

  return (
    <Dropdown.Item css={{ h: 'auto' }}>
      <Flex direction="column" css={{ w: '100%' }}>
        <Flex align="center">
          <SpeakerIcon />
          <Text css={{ ml: '$4' }}>Volume{audioTrack.volume ? `(${audioTrack.volume})` : ''}</Text>
        </Flex>
        <Slider
          css={{ my: '0.5rem' }}
          step={5}
          value={[audioTrack.volume]}
          onValueChange={e => {
            hmsActions.setVolume(e[0], audioTrack?.id);
          }}
        />
      </Flex>
    </Dropdown.Item>
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
