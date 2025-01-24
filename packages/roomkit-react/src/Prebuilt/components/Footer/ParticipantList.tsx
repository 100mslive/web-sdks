import React, { Fragment, useCallback, useState } from 'react';
import { useDebounce, useMedia } from 'react-use';
import {
  HMSPeer,
  HMSPeerType,
  HMSRoleName,
  selectAvailableRoleNames,
  selectHandRaisedPeers,
  selectHasPeerHandRaised,
  selectIsLargeRoom,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerCount,
  selectPermissions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  AddIcon,
  CallIcon,
  ChangeRoleIcon,
  CrossIcon,
  HandIcon,
  MicOffIcon,
  PeopleIcon,
  PersonSettingsIcon,
  SearchIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Accordion, Box, Button, config as cssConfig, Dropdown, Flex, Input, Text, textEllipsis } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
import { ConnectionIndicator } from '../Connection/ConnectionIndicator';
import { RemoveParticipant } from '../RemoveParticipant';
import { RoleChangeModal } from '../RoleChangeModal';
import { RoleAccordion } from './RoleAccordion';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { useSidepaneResetOnLayoutUpdate } from '../AppData/useSidepaneResetOnLayoutUpdate';
import { usePeerOnStageActions } from '../hooks/usePeerOnStageActions';
import { useParticipants } from '../../common/hooks';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const ParticipantList = ({
  offStageRoles = [],
  onActive,
  footer,
}: {
  offStageRoles: HMSRoleName[];
  onActive: (role: string) => void;
  footer?: React.ReactNode;
}) => {
  const [filter, setFilter] = useState<{ search?: string } | undefined>();
  const { participants, isConnected, peerCount } = useParticipants(filter);
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const peersOrderedByRoles: Record<string, HMSPeer[]> = {};

  const handRaisedPeers = useHMSStore(selectHandRaisedPeers);

  participants.forEach(participant => {
    if (participant.roleName) {
      if (peersOrderedByRoles[participant.roleName] === undefined) {
        peersOrderedByRoles[participant.roleName] = [];
      }
      peersOrderedByRoles[participant.roleName].push(participant);
    }
  });

  // prefill off_stage roles of large rooms to load more peers
  if (isLargeRoom) {
    offStageRoles.forEach(role => {
      if (!peersOrderedByRoles[role]) {
        peersOrderedByRoles[role] = [];
      }
    });
  }

  useSidepaneResetOnLayoutUpdate('participant_list', SIDE_PANE_OPTIONS.PARTICIPANTS);

  const onSearch = useCallback((value: string) => {
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
      <Flex
        direction="column"
        css={{
          size: '100%',
          gap: '$4',
        }}
      >
        {!filter?.search && participants.length === 0 ? null : <ParticipantSearch onSearch={onSearch} inSidePane />}
        <VirtualizedParticipants
          peersOrderedByRoles={peersOrderedByRoles}
          handRaisedList={handRaisedPeers}
          isConnected={!!isConnected}
          filter={filter}
          offStageRoles={offStageRoles}
          isLargeRoom={isLargeRoom}
          onActive={onActive}
        >
          {participants.length === 0 ? (
            <Flex
              align="center"
              justify="center"
              className="emptyParticipants"
              css={{ w: '100%', p: '$8 0', display: 'none' }}
            >
              <Text variant="sm">{!filter ? 'No participants' : 'No matching participants'}</Text>
            </Flex>
          ) : null}
        </VirtualizedParticipants>
        {footer}
      </Flex>
    </Fragment>
  );
};

export const ParticipantCount = () => {
  const peerCount = useHMSStore(selectPeerCount);
  const toggleSidepane = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const isPeerListOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.PARTICIPANTS);

  if (peerCount === 0) {
    return null;
  }
  return (
    <IconButton
      css={{
        w: 'auto',
        p: '$4',
        h: 'auto',
        bg: isPeerListOpen ? '$surface_brighter' : '',
      }}
      onClick={() => {
        if (peerCount > 0) {
          toggleSidepane();
        }
      }}
      data-testid="participant_list"
    >
      <PeopleIcon />
      <Text variant="sm" css={{ mx: '$4', c: 'inherit' }}>
        {getFormattedCount(peerCount)}
      </Text>
    </IconButton>
  );
};

export const Participant = ({
  peer,
  isConnected,
  isHandRaisedAccordion,
  style,
}: {
  peer: HMSPeer;
  isConnected: boolean;
  isHandRaisedAccordion?: boolean;
  style: React.CSSProperties;
}) => {
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
      style={style}
    >
      <Text
        variant="sm"
        css={{ ...textEllipsis('100%'), flex: '1 1 0', mr: '$8', fontWeight: '$semiBold', color: '$on_surface_high' }}
      >
        {peer.name} {localPeerId === peer.id ? '(You)' : ''}
      </Text>
      {isConnected && peer.roleName ? (
        <ParticipantActions
          peerId={peer.id}
          peerType={peer.type}
          role={peer.roleName}
          isHandRaisedAccordion={isHandRaisedAccordion}
        />
      ) : null}
    </Flex>
  );
};

const VirtualizedParticipants = ({
  peersOrderedByRoles = {},
  isConnected,
  filter,
  handRaisedList = [],
  offStageRoles,
  isLargeRoom,
  onActive,
  children,
}: {
  peersOrderedByRoles: Record<string, HMSPeer[]>;
  isConnected: boolean;
  filter: undefined | { search?: string };
  handRaisedList: HMSPeer[];
  offStageRoles: HMSRoleName[];
  isLargeRoom: boolean;
  onActive: (role: string) => void;
  children: React.ReactNode;
}) => {
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
        '& > div:empty ~ .emptyParticipants': {
          display: 'flex',
        },
      }}
    >
      <Accordion.Root type={isLargeRoom ? 'single' : 'multiple'} collapsible>
        {handRaisedList.length > 0 ? (
          <RoleAccordion
            peerList={handRaisedList}
            roleName="Hand Raised"
            filter={filter}
            isConnected={isConnected}
            isHandRaisedAccordion
            offStageRoles={offStageRoles}
          />
        ) : null}
        {Object.keys(peersOrderedByRoles).map(role => (
          <RoleAccordion
            key={role}
            peerList={peersOrderedByRoles[role]}
            roleName={role}
            isConnected={isConnected}
            filter={filter}
            offStageRoles={offStageRoles}
            onActive={onActive}
          />
        ))}
      </Accordion.Root>
      {children}
    </Flex>
  );
};

/**
 * shows settings to change for a participant like changing their role
 */
const ParticipantActions = React.memo(
  ({
    peerId,
    peerType,
    role,
    isHandRaisedAccordion,
  }: {
    peerId: string;
    role: string;
    isHandRaisedAccordion?: boolean;
    peerType: HMSPeerType;
  }) => {
    const isHandRaised = useHMSStore(selectHasPeerHandRaised(peerId));
    const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
    const canRemoveOthers = useHMSStore(selectPermissions)?.removeOthers;
    const { elements } = useRoomLayoutConferencingScreen();
    const { on_stage_exp } = elements || {};
    const shouldShowMoreActions = (on_stage_exp && canChangeRole) || canRemoveOthers;
    const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));

    return (
      <Flex
        align="center"
        css={{
          flexShrink: 0,
          gap: '$8',
        }}
      >
        {isHandRaisedAccordion ? (
          <HandRaisedAccordionParticipantActions peerId={peerId} role={role} />
        ) : (
          <>
            <ConnectionIndicator peerId={peerId} />
            {peerType === HMSPeerType.SIP && (
              <Flex
                align="center"
                justify="center"
                css={{ p: '$1', c: '$on_surface_high', bg: '$surface_bright', borderRadius: '$round' }}
              >
                <CallIcon width={19} height={19} />
              </Flex>
            )}
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

            {shouldShowMoreActions ? <ParticipantMoreActions peerId={peerId} role={role} /> : null}
          </>
        )}
      </Flex>
    );
  },
);

const quickActionStyle = { p: '$1', borderRadius: '$round' };
const HandRaisedAccordionParticipantActions = ({ peerId, role }: { peerId: string; role: string }) => {
  const { handleStageAction, lowerPeerHand, shouldShowStageRoleChange, isInStage } = usePeerOnStageActions({
    peerId,
    role,
  });
  if (!shouldShowStageRoleChange) {
    return null;
  }
  return (
    <>
      <Button variant="standard" css={quickActionStyle} onClick={lowerPeerHand}>
        <CrossIcon height={18} width={18} />
      </Button>
      {!isInStage && (
        <Button variant="primary" onClick={handleStageAction} css={quickActionStyle}>
          <AddIcon height={18} width={18} />
        </Button>
      )}
    </>
  );
};

const ParticipantMoreActions = ({ peerId, role }: { peerId: string; role: string }) => {
  const {
    open,
    setOpen,
    bring_to_stage_label,
    remove_from_stage_label,
    handleStageAction,
    isInStage,
    shouldShowStageRoleChange,
  } = usePeerOnStageActions({ peerId, role });
  const canChangeRole = !!useHMSStore(selectPermissions)?.changeRole;
  const [openRoleChangeModal, setOpenRoleChangeModal] = useState(false);
  const roles = useHMSStore(selectAvailableRoleNames);

  return (
    <>
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

            {canChangeRole && roles.length > 1 ? (
              <Dropdown.Item css={{ bg: '$surface_default' }} onClick={() => setOpenRoleChangeModal(true)}>
                <PersonSettingsIcon />
                <Text variant="sm" css={{ ml: '$4', fontWeight: '$semiBold', c: '$on_surface_high' }}>
                  Switch Role
                </Text>
              </Dropdown.Item>
            ) : null}
            <RemoveParticipant peerId={peerId} />
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {openRoleChangeModal && <RoleChangeModal peerId={peerId} onOpenChange={setOpenRoleChangeModal} />}
    </>
  );
};

export const ParticipantSearch = ({
  onSearch,
  placeholder = 'Search for participants',
  inSidePane = false,
}: {
  inSidePane?: boolean;
  placeholder?: string;
  onSearch: (val: string) => void;
}) => {
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
      onClick={e => e.stopPropagation()}
    >
      <SearchIcon style={{ position: 'absolute', left: '0.5rem' }} />
      <Input
        type="text"
        placeholder={placeholder}
        css={{ w: '100%', p: '$6', pl: '$14', bg: inSidePane ? '$surface_default' : '$surface_dim' }}
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
