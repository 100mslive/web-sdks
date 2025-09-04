import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  HMSPollState,
  selectLocalPeerRoleName,
  selectPermissions,
  selectPolls,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { QuestionIcon, StatsIcon } from '@100mslive/react-icons';
import { Button, Flex, Input, Switch, Text } from '../../../..';
// @ts-ignore
import { Container, ContentHeader, ErrorText } from '../../Streaming/Common';
// @ts-ignore
import { usePollViewToggle } from '../../AppData/useSidepane';
// @ts-ignore
import { usePollViewState } from '../../AppData/useUISettings';
// @ts-ignore
import { isValidTextInput } from '../../../common/utils';
import { StatusIndicator } from '../common/StatusIndicator';
import { INTERACTION_TYPE, POLL_STATE, POLL_VIEWS } from '../../../common/constants';

export const PollsQuizMenu = () => {
  const togglePollView = usePollViewToggle();
  const permissions = useHMSStore(selectPermissions);

  return (
    <Container rounded>
      <ContentHeader content="Polls and Quizzes" onClose={togglePollView} />
      <Flex direction="column" css={{ px: '$10', pb: '$10', overflowY: 'auto' }}>
        {permissions?.pollWrite && <AddMenu />}
        <PrevMenu />
      </Flex>
    </Container>
  );
};

function InteractionSelectionCard({
  title,
  icon,
  active,
  onClick,
}: {
  title: string;
  icon: React.JSX.Element;
  active: boolean;
  onClick: () => void;
}) {
  const activeBorderStyle = active ? '$space$px solid $primary_default' : '$space$px solid $border_bright';
  return (
    <Flex
      onClick={onClick}
      css={{
        border: activeBorderStyle,
        p: '$4',
        r: '$2',
        w: '100%',
        cursor: 'pointer',
      }}
      align="center"
    >
      <Flex
        css={{
          border: activeBorderStyle,
          p: '$4',
          bg: '$surface_bright',
          c: '$on_surface_high',
          r: '$0',
        }}
      >
        {icon}
      </Flex>
      <Text variant="sub1" css={{ ml: '$md' }}>
        {title}
      </Text>
    </Flex>
  );
}

const AddMenu = () => {
  const actions = useHMSActions();
  const [title, setTitle] = useState('');
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const [hideVoteCount, setHideVoteCount] = useState(false);
  const [error, setError] = useState();
  const [titleError, setTitleError] = useState('');
  const { setPollState } = usePollViewState();
  const [interactionType, setInteractionType] = useState(INTERACTION_TYPE.POLL);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [interactionType]);

  const handleCreate = (id: string) => {
    setPollState({
      [POLL_STATE.pollInView]: id,
      [POLL_STATE.view]: POLL_VIEWS.CREATE_QUESTIONS,
    });
  };

  const validateTitle = useMemo(() => {
    if (!isValidTextInput(title)) {
      if (title) {
        setTitleError('The title should have between 2-100 characters');
      }
      return true;
    } else {
      setTitleError('');
      return false;
    }
  }, [title]);

  return (
    <>
      <Text variant="caption" css={{ c: '$on_surface_medium', mb: '$md' }}>
        Select the type you want to continue with
      </Text>
      <Flex css={{ w: '100%', gap: '$10', mb: '$md' }}>
        <InteractionSelectionCard
          title={INTERACTION_TYPE.POLL}
          icon={<StatsIcon width={32} height={32} />}
          onClick={() => setInteractionType(INTERACTION_TYPE.POLL)}
          active={interactionType === INTERACTION_TYPE.POLL}
        />
        <InteractionSelectionCard
          title={INTERACTION_TYPE.QUIZ}
          icon={<QuestionIcon width={32} height={32} />}
          onClick={() => setInteractionType(INTERACTION_TYPE.QUIZ)}
          active={interactionType === INTERACTION_TYPE.QUIZ}
        />
      </Flex>
      <Flex direction="column" css={{ mb: '$10' }}>
        <Text variant="body2" css={{ mb: '$4' }}>{`Name this ${interactionType.toLowerCase()}`}</Text>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter a name to continue"
          value={title}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value.trimStart())}
          css={{
            backgroundColor: '$surface_bright',
            border: '1px solid $border_default',
          }}
        />
        <Flex align="center" css={{ mt: '$10' }}>
          <Switch onCheckedChange={(value: boolean) => setHideVoteCount(value)} css={{ mr: '$6' }} />
          <Text variant="body2" css={{ c: '$on_surface_medium' }}>
            Hide Vote Count
          </Text>
        </Flex>

        <Button
          variant="primary"
          disabled={validateTitle}
          css={{ mt: '$10' }}
          onClick={async () => {
            const id = Date.now().toString();
            await actions.interactivityCenter
              .createPoll({
                id,
                title,
                anonymous: false,
                rolesThatCanViewResponses: hideVoteCount && localPeerRoleName ? [localPeerRoleName] : undefined,
                // @ts-ignore
                type: interactionType.toLowerCase(),
              })
              .then(() => handleCreate(id))
              .catch(err => setError(err.message));
          }}
        >
          Create {interactionType}
        </Button>
        <ErrorText error={error || titleError} />
      </Flex>
    </>
  );
};

const PrevMenu = () => {
  const hmsActions = useHMSActions();
  const polls = useHMSStore(selectPolls);
  const sortedPolls = useMemo(
    () =>
      polls
        ?.sort((a, b) => (b?.createdAt?.getTime?.() || 0) - (a?.createdAt?.getTime?.() || 0))
        ?.sort((a, b) => (b?.state === 'started' ? 1 : 0) - (a?.state === 'started' ? 1 : 0)),
    [polls],
  );
  const permissions = useHMSStore(selectPermissions);

  useEffect(() => {
    const updatePolls = async () => {
      await hmsActions.interactivityCenter.getPolls();
    };
    updatePolls();
  }, [hmsActions.interactivityCenter]);

  return polls?.length ? (
    <Flex
      direction="column"
      css={{
        width: '100%',
        ...(permissions?.pollWrite ? { borderTop: '$space$px solid $border_bright', paddingTop: '$10' } : {}),
      }}
    >
      <Text variant="h6" css={{ c: '$on_surface_high' }}>
        Previous Polls and Quizzes
      </Text>
      <Flex direction="column" css={{ gap: '$10', mt: '$8' }}>
        {sortedPolls?.map(poll => (
          <InteractionCard key={poll.id} id={poll.id} title={poll.title} status={poll.state} />
        ))}
      </Flex>
    </Flex>
  ) : null;
};

const InteractionCard = ({ id, title, status }: { id: string; title: string; status?: HMSPollState }) => {
  const { setPollState } = usePollViewState();

  return (
    <Flex direction="column" css={{ backgroundColor: '$surface_bright', borderRadius: '$1', p: '$8' }}>
      <Flex css={{ w: '100%', justifyContent: 'space-between', mb: '$sm' }}>
        <Text variant="sub1" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
          {title}
        </Text>
        <StatusIndicator status={status} />
      </Flex>
      <Flex css={{ w: '100%', gap: '$4' }} justify="end">
        <Button
          variant="primary"
          onClick={() =>
            setPollState({
              [POLL_STATE.pollInView]: id,
              [POLL_STATE.view]: status === 'created' ? POLL_VIEWS.CREATE_QUESTIONS : POLL_VIEWS.VOTE,
            })
          }
        >
          View
        </Button>
      </Flex>
    </Flex>
  );
};
