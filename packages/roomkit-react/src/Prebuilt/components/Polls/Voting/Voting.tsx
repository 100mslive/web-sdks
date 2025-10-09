import { useEffect, useRef, useState } from 'react';
import {
  selectLocalPeer,
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
// @ts-ignore
import { getPeerResponses } from '../../../common/utils';
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
  const fetchedInitialResponses = useRef(false);
  const [savedResponses, setSavedResponses] = useState<Record<any, any>>({});
  const localPeer = useHMSStore(selectLocalPeer);
  const localPeerId = localPeer?.id;
  const customerUserId = localPeer?.customerUserId;

  // To reset whenever a different poll is opened
  useEffect(() => {
    fetchedInitialResponses.current = false;
    setSavedResponses({});
  }, [id, setSavedResponses]);

  useEffect(() => {
    const getResponses = async () => {
      if (poll && actions.interactivityCenter && !fetchedInitialResponses.current) {
        await actions.interactivityCenter.getPollResponses(poll, true);
        fetchedInitialResponses.current = true;
      }
    };
    getResponses();
  }, [poll, actions.interactivityCenter]);

  useEffect(() => {
    if (poll?.questions) {
      const localPeerResponses = getPeerResponses(poll.questions, localPeerId, customerUserId);
      // @ts-ignore
      localPeerResponses?.forEach(response => {
        if (response) {
          setSavedResponses(prev => {
            const prevCopy = { ...prev };
            prevCopy[response[0]?.questionIndex] = { option: response[0]?.option, options: response[0]?.options };
            return prevCopy;
          });
        }
      });
    }
  }, [localPeerId, poll?.questions, id, customerUserId]);

  if (!poll) {
    return null;
  }

  const canViewLeaderboard = poll.type === 'quiz' && poll.state === 'stopped' && !poll.anonymous;

  return (
    <Container rounded>
      <Flex
        align="center"
        css={{
          gap: '$4',
          py: '$6',
          px: '$8',
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
        <StatusIndicator status={poll.state} />
        <Box
          css={{
            marginLeft: 'auto',
            cursor: 'pointer',
            '&:hover': { opacity: '0.8' },
            height: 'fit-content',
          }}
        >
          <CrossIcon onClick={toggleVoting} />
        </Box>
      </Flex>

      <Flex direction="column" css={{ p: '$8 $10', flex: '1 1 0', overflowY: 'auto' }}>
        {poll.state === 'started' ? (
          <Text css={{ color: '$on_surface_medium', fontWeight: '$semiBold' }}>
            {pollCreatorName || 'Participant'} started a {poll.type}
          </Text>
        ) : null}

        {showSingleView ? (
          <TimedView poll={poll} localPeerResponses={savedResponses} updateSavedResponses={setSavedResponses} />
        ) : (
          <StandardView poll={poll} localPeerResponses={savedResponses} updateSavedResponses={setSavedResponses} />
        )}
      </Flex>
      <Flex
        css={{ w: '100%', justifyContent: 'end', alignItems: 'center', p: '$8', borderTop: '1px solid $border_bright' }}
      >
        {poll.state === 'started' && canEndActivity && (
          <Button
            variant="danger"
            css={{ fontWeight: '$semiBold', w: 'max-content' }}
            onClick={() => actions.interactivityCenter.stopPoll(id)}
          >
            End {poll.type}
          </Button>
        )}
        {canViewLeaderboard ? (
          <Button css={{ fontWeight: '$semiBold', w: 'max-content' }} onClick={() => setPollView(POLL_VIEWS.RESULTS)}>
            View Leaderboard
          </Button>
        ) : null}
      </Flex>
    </Container>
  );
};
