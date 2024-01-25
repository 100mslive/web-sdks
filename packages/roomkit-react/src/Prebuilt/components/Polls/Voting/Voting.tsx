import React from 'react';
import {
  selectPeerNameByID,
  selectPermissions,
  selectPollByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { Box, Button, Flex, Text } from '../../../..';
// @ts-ignore
import { Container } from '../../Streaming/Common';
import { StandardView } from './StandardVoting';
import { TimedView } from './TimedVoting';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
import { StatusIndicator } from '../common/StatusIndicator';
import { POLL_VIEWS } from '../../../common/constants';

export const Voting = ({ id, toggleVoting }: { id: string; toggleVoting: () => void }) => {
  const actions = useHMSActions();
  const poll = useHMSStore(selectPollByID(id));
  const pollCreatorName = useHMSStore(selectPeerNameByID(poll?.createdBy));
  const permissions = useHMSStore(selectPermissions);
  const canEndActivity = !!permissions?.pollWrite;
  const { setPollView } = usePollViewState();
  // Sets view - linear or vertical, toggles timer indicator
  const showSingleView = poll?.type === 'quiz' && poll.state === 'started';

  if (!poll) {
    return null;
  }

  const canViewLeaderboard = poll.type === 'quiz' && poll.state === 'stopped' && !poll.anonymous;

  const isLive = poll.state === 'started';

  return (
    <Container rounded>
      <Flex
        align="center"
        css={{
          gap: '$6',
          py: '$6',
          px: '$10',
          my: '$4',
          w: '100%',
          color: '$on_surface_high',
          borderBottom: '1px solid $border_default',
        }}
      >
        <Flex
          onClick={() => setPollView(POLL_VIEWS.CREATE_POLL_QUIZ)}
          css={{ cursor: 'pointer', c: '$on_surface_medium', '&:hover': { color: '$on_surface_high' } }}
        >
          <ChevronLeftIcon />
        </Flex>
        <Text variant="h6">{poll.title}</Text>
        <StatusIndicator isLive={isLive} />
        <Box
          css={{
            marginLeft: 'auto',
            cursor: 'pointer',
            '&:hover': { opacity: '0.8' },
          }}
        >
          <CrossIcon onClick={toggleVoting} />
        </Box>
      </Flex>

      <Flex direction="column" css={{ p: '$8 $10', overflowY: 'auto', pb: canViewLeaderboard ? '$20' : '$8' }}>
        {poll.state === 'started' ? (
          <Text css={{ color: '$on_surface_medium', fontWeight: '$semiBold' }}>
            {pollCreatorName || 'Participant'} started a {poll.type}
          </Text>
        ) : null}

        {showSingleView ? <TimedView poll={poll} /> : <StandardView poll={poll} />}

        {poll.state === 'started' && canEndActivity && (
          <Button
            variant="danger"
            css={{ fontWeight: '$semiBold', w: 'max-content', ml: 'auto', mt: '$8' }}
            onClick={() => actions.interactivityCenter.stopPoll(id)}
          >
            End {poll.type}
          </Button>
        )}

        {canViewLeaderboard ? (
          <Flex
            css={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              w: '100%',
              borderTop: '1px solid $border_bright',
              p: '$2',
              bg: '$surface_dim',
            }}
          >
            <Button
              css={{
                fontWeight: '$semiBold',
                w: 'max-content',
                ml: 'auto',
              }}
              onClick={() => setPollView(POLL_VIEWS.RESULTS)}
            >
              View Leaderboard
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Container>
  );
};
