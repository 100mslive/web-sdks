// @ts-check
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import {
  HMSRoomState,
  selectLocalPeer,
  selectLocalPeerRoleName,
  selectRoomState,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CheckCircleIcon, ChevronDownIcon, CrossCircleIcon } from '@100mslive/react-icons';
import { Box, Button, Flex, Text } from '../../../../';
import { checkCorrectAnswer } from '../../../common/utils';
import { MultipleChoiceOptions } from '../common/MultipleChoiceOptions';
import { SingleChoiceOptions } from '../common/SingleChoiceOptions';
import { QUESTION_TYPE } from '../../../common/constants';

export const QuestionCard = ({
  pollID,
  isQuiz,
  startedBy,
  pollState,
  index,
  totalQuestions,
  result,
  type,
  text,
  options = [],
  answer,
  localPeerResponse,
  updateSavedResponses,
  rolesThatCanViewResponses,
}) => {
  const actions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const roomState = useHMSStore(selectRoomState);
  const isLocalPeerCreator = localPeer?.id === startedBy;
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const roleCanViewResponse =
    !rolesThatCanViewResponses ||
    rolesThatCanViewResponses.length === 0 ||
    rolesThatCanViewResponses.includes(localPeerRoleName || '');
  const [localPeerChoice, setLocalPeerChoice] = useState(localPeerResponse);

  useEffect(() => {
    setLocalPeerChoice(localPeerResponse);
  }, [localPeerResponse]);

  const showVoteCount =
    roleCanViewResponse && (localPeerChoice || (isLocalPeerCreator && pollState === 'stopped')) && !isQuiz;

  const isLive = pollState === 'started';
  const pollEnded = pollState === 'stopped';
  const canRespond = isLive && !localPeerChoice;
  const startTime = useRef(Date.now());
  const isCorrectAnswer = checkCorrectAnswer(answer, localPeerChoice, type);

  const [singleOptionAnswer, setSingleOptionAnswer] = useState();
  const [multipleOptionAnswer, setMultipleOptionAnswer] = useState(new Set());
  const [showOptions, setShowOptions] = useState(true);

  const respondedToQuiz = isQuiz && localPeerChoice && !localPeerChoice.skipped;

  const isValidVote = useMemo(() => {
    if (type === QUESTION_TYPE.SINGLE_CHOICE) {
      return singleOptionAnswer !== undefined;
    } else if (type === QUESTION_TYPE.MULTIPLE_CHOICE) {
      return multipleOptionAnswer.size > 0;
    }
  }, [singleOptionAnswer, multipleOptionAnswer, type]);

  const handleVote = useCallback(async () => {
    if (!isValidVote) {
      return;
    }
    const submittedResponse = {
      questionIndex: index,
      option: singleOptionAnswer,
      options: Array.from(multipleOptionAnswer),
      duration: Date.now() - startTime.current,
    };
    await actions.interactivityCenter.addResponsesToPoll(pollID, [submittedResponse]);
    updateSavedResponses(prev => {
      const prevCopy = { ...prev };
      prevCopy[index] = { option: singleOptionAnswer, options: Array.from(multipleOptionAnswer) };
      return prevCopy;
    });
    startTime.current = Date.now();
  }, [
    isValidVote,
    index,
    singleOptionAnswer,
    multipleOptionAnswer,
    actions.interactivityCenter,
    pollID,
    updateSavedResponses,
  ]);

  return (
    <Box
      css={{
        backgroundColor: 'surface.bright',
        borderRadius: '1',
        p: 'md',
        mt: 'md',
        border:
          respondedToQuiz && !isLive
            ? `1px solid ${isCorrectAnswer ? '$alert_success' : '$alert_error_default'}`
            : 'none',
      }}
    >
      <Flex align="center" justify="between">
        <Text
          variant="caption"
          css={{
            color: match({ respondedToQuiz, isLive, isCorrectAnswer })
              .when(
                ({ respondedToQuiz, isLive }) => respondedToQuiz && !isLive,
                ({ isCorrectAnswer }) => (isCorrectAnswer ? '$alert_success' : '$alert_error_default'),
              )
              .otherwise(() => '$on_surface_low'),
            fontWeight: '$semiBold',
            display: 'flex',
            alignItems: 'center',
            gap: '4',
          }}
        >
          {match({ respondedToQuiz, pollEnded, isCorrectAnswer })
            .when(
              ({ respondedToQuiz, pollEnded }) => respondedToQuiz && pollEnded,
              ({ isCorrectAnswer }) => {
                return isCorrectAnswer ? (
                  <CheckCircleIcon height={16} width={16} />
                ) : (
                  <CrossCircleIcon height={16} width={16} />
                );
              },
            )
            .otherwise(() => null)}
          QUESTION {index} OF {totalQuestions}: {type.toUpperCase()}
        </Text>
      </Flex>

      <Flex justify="between" css={{ my: 'md' }}>
        <Text css={{ color: 'onSurface.high' }}>{text}</Text>
        <Box
          css={{ color: 'onSurface.medium', '&:hover': { color: 'onSurface.high', cursor: 'pointer' } }}
          onClick={() => setShowOptions(prev => !prev)}
        >
          <ChevronDownIcon
            style={{ transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          />
        </Box>
      </Flex>

      <Box
        css={{ maxHeight: showOptions ? '$80' : '0', transition: 'max-height 0.3s ease', overflowY: 'auto', mb: '4' }}
      >
        {type === QUESTION_TYPE.SINGLE_CHOICE ? (
          <SingleChoiceOptions
            key={index}
            questionIndex={index}
            isQuiz={isQuiz}
            canRespond={canRespond}
            correctOptionIndex={answer?.option}
            options={options}
            setAnswer={setSingleOptionAnswer}
            totalResponses={result?.totalResponses}
            showVoteCount={showVoteCount}
            localPeerResponse={localPeerChoice}
            isStopped={pollState === 'stopped'}
          />
        ) : null}

        {type === QUESTION_TYPE.MULTIPLE_CHOICE ? (
          <MultipleChoiceOptions
            questionIndex={index}
            isQuiz={isQuiz}
            canRespond={canRespond}
            correctOptionIndexes={answer?.options}
            options={options}
            selectedOptions={multipleOptionAnswer}
            setSelectedOptions={setMultipleOptionAnswer}
            totalResponses={result?.totalResponses}
            showVoteCount={showVoteCount}
            localPeerResponse={localPeerChoice}
            isStopped={pollState === 'stopped'}
          />
        ) : null}
      </Box>
      {isLive && (
        <QuestionActions
          disableVote={roomState !== HMSRoomState.Connected}
          isValidVote={isValidVote}
          onVote={handleVote}
          response={localPeerChoice}
          isQuiz={isQuiz}
        />
      )}
    </Box>
  );
};

const QuestionActions = ({ isValidVote, response, isQuiz, onVote, disableVote }) => {
  return (
    <Flex align="center" justify="end" css={{ gap: '4', w: '100%' }}>
      {response ? (
        <Text css={{ fontWeight: '$semiBold', color: 'onSurface.medium' }}>
          {response.skipped ? 'Skipped' : null}
          {isQuiz && !response.skipped ? 'Answered' : null}
          {!isQuiz && !response.skipped ? 'Voted' : null}
        </Text>
      ) : (
        <Button css={{ p: '$xs $10', fontWeight: '$semiBold' }} disabled={!isValidVote || disableVote} onClick={onVote}>
          {isQuiz ? 'Answer' : 'Vote'}
        </Button>
      )}
    </Flex>
  );
};
