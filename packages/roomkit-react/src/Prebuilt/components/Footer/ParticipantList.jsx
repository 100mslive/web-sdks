import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDebounce, useMeasure } from 'react-use';
import { FixedSizeList } from 'react-window';
import {
  selectAudioTrackByPeerID,
  selectLocalPeerID,
  selectPeerCount,
  selectPeerMetadata,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useParticipants,
} from '@100mslive/react-sdk';
import {
  ChangeRoleIcon,
  HandRaiseIcon,
  PeopleIcon,
  RemoveUserIcon,
  SearchIcon,
  SpeakerIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Avatar, Box, Dropdown, Flex, Input, Slider, Text, textEllipsis } from '../../..';
import IconButton from '../../IconButton';
import { ChatParticipantHeader } from '../Chat/ChatParticipantHeader';
import { ConnectionIndicator } from '../Connection/ConnectionIndicator';
import { RoleChangeModal } from '../RoleChangeModal';
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { isInternalRole } from '../../common/utils';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

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
          participants={participants}
          isConnected={isConnected}
          setSelectedPeerId={setSelectedPeerId}
        />
      </Flex>
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

const VirtualizedParticipants = ({ participants, isConnected, setSelectedPeerId }) => {
  const [ref, { width, height }] = useMeasure();
  return (
    <Box
      ref={ref}
      css={{
        flex: '1 1 0',
        mr: '-$10',
      }}
    >
      <FixedSizeList
        itemSize={68}
        itemData={{ participants, isConnected, setSelectedPeerId }}
        itemKey={itemKey}
        itemCount={participants.length}
        width={width}
        height={height}
      >
        {VirtualisedParticipantListItem}
      </FixedSizeList>
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

const Participant = ({ peer, isConnected, setSelectedPeerId }) => {
  return (
    <Fragment>
      <Flex
        key={peer.id}
        css={{ w: '100%', py: '$4', pr: '$10' }}
        align="center"
        data-testid={'participant_' + peer.name}
      >
        <Avatar
          name={peer.name}
          css={{
            position: 'unset',
            transform: 'unset',
            mr: '$8',
            fontSize: '$sm',
            size: '$12',
            p: '$4',
          }}
        />
        <Flex direction="column" css={{ flex: '1 1 0' }}>
          <Text variant="md" css={{ ...textEllipsis(150), fontWeight: '$semiBold' }}>
            {peer.name}
          </Text>
          <Text variant="sub2">{peer.roleName}</Text>
        </Flex>
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
    </Fragment>
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

  return (
    <Flex align="center" css={{ flexShrink: 0 }}>
      <ConnectionIndicator peerId={peerId} />
      {isHandRaised && <HandRaiseIcon />}
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
      <Dropdown.Trigger asChild data-testid="participant_more_actions" css={{ p: '$2', r: '$0' }} tabIndex={0}>
        <Text>
          <VerticalMenuIcon />
        </Text>
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
