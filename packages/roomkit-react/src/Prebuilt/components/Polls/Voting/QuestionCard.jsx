// @ts-check
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { selectLocalPeer, selectLocalPeerRoleName, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
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
  setCurrentIndex,
  responses = [],
  rolesThatCanViewResponses,
}) => {
  const actions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const localPeerResponse = responses?.find(
    response => response.peer?.peerid === localPeer?.id || response.peer?.userid === localPeer?.customerUserId,
  );

  const isLocalPeerCreator = localPeer?.id === startedBy;
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const roleCanViewResponse =
    !rolesThatCanViewResponses ||
    rolesThatCanViewResponses.length === 0 ||
    rolesThatCanViewResponses.includes(localPeerRoleName || '');
  const showVoteCount =
    roleCanViewResponse && (localPeerResponse || (isLocalPeerCreator && pollState === 'stopped')) && !isQuiz;

  const isLive = pollState === 'started';
  const pollEnded = pollState === 'stopped';
  const canRespond = isLive && !localPeerResponse;
  const startTime = useRef(Date.now());
  const isCorrectAnswer = checkCorrectAnswer(answer, localPeerResponse, type);

  const [singleOptionAnswer, setSingleOptionAnswer] = useState();
  const [multipleOptionAnswer, setMultipleOptionAnswer] = useState(new Set());
  const [showOptions, setShowOptions] = useState(true);

  const respondedToQuiz = isQuiz && localPeerResponse && !localPeerResponse.skipped;

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

    await actions.interactivityCenter.addResponsesToPoll(pollID, [
      {
        questionIndex: index,
        option: singleOptionAnswer,
        options: Array.from(multipleOptionAnswer),
        duration: Date.now() - startTime.current,
      },
    ]);
    startTime.current = Date.now();
  }, [isValidVote, actions.interactivityCenter, pollID, index, singleOptionAnswer, multipleOptionAnswer]);

  return (
    <Box
      css={{
        backgroundColor: '$surface_bright',
        borderRadius: '$1',
        p: '$md',
        mt: '$md',
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
            color:
              respondedToQuiz && !isLive
                ? isCorrectAnswer
                  ? '$alert_success'
                  : '$alert_error_default'
                : '$on_surface_low',
            fontWeight: '$semiBold',
            display: 'flex',
            alignItems: 'center',
            gap: '$4',
          }}
        >
          {respondedToQuiz && isCorrectAnswer && pollEnded ? <CheckCircleIcon height={16} width={16} /> : null}
          {respondedToQuiz && !isCorrectAnswer && pollEnded ? <CrossCircleIcon height={16} width={16} /> : null}
          QUESTION {index} OF {totalQuestions}: {type.toUpperCase()}
        </Text>
      </Flex>

      <Flex justify="between" css={{ my: '$md' }}>
        <Text css={{ color: '$on_surface_high' }}>{text}</Text>
        <Box
          css={{ color: '$on_surface_medium', '&:hover': { color: '$on_surface_high', cursor: 'pointer' } }}
          onClick={() => setShowOptions(prev => !prev)}
        >
          <ChevronDownIcon
            style={{ transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          />
        </Box>
      </Flex>

      <Box
        css={{ maxHeight: showOptions ? '$80' : '0', transition: 'max-height 0.3s ease', overflowY: 'auto', mb: '$4' }}
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
            localPeerResponse={localPeerResponse}
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
            localPeerResponse={localPeerResponse}
            isStopped={pollState === 'stopped'}
          />
        ) : null}
      </Box>
      {isLive && (
        <QuestionActions
          isValidVote={isValidVote}
          onVote={handleVote}
          response={localPeerResponse}
          isQuiz={isQuiz}
          incrementIndex={() => {
            setCurrentIndex(curr => Math.min(totalQuestions, curr + 1));
          }}
        />
      )}
    </Box>
  );
};

const QuestionActions = ({ isValidVote, response, isQuiz, onVote, incrementIndex }) => {
  return (
    <Flex align="center" justify="end" css={{ gap: '$4', w: '100%' }}>
      {response ? (
        <Text css={{ fontWeight: '$semiBold', color: '$on_surface_medium' }}>
          {response.skipped ? 'Skipped' : null}
          {isQuiz && !response.skipped ? 'Answered' : null}
          {!isQuiz && !response.skipped ? 'Voted' : null}
        </Text>
      ) : (
        <Button
          css={{ p: '$xs $10', fontWeight: '$semiBold' }}
          disabled={!isValidVote}
          onClick={() => {
            onVote();
            incrementIndex();
          }}
        >
          {isQuiz ? 'Answer' : 'Vote'}
        </Button>
      )}
    </Flex>
  );
};
