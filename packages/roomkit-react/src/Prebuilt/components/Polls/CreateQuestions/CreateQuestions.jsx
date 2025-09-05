// @ts-check
import React, { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { selectPollByID, useHMSActions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { AddCircleIcon } from '@100mslive/react-icons';
import { Button, Flex, Text } from '../../../../';
import { Container, ContentHeader } from '../../Streaming/Common';
import { isValidQuestion, QuestionForm } from './QuestionForm';
import { SavedQuestion } from './SavedQuestion';
import { usePollViewToggle } from '../../AppData/useSidepane';
import { usePollViewState } from '../../AppData/useUISettings';
import { POLL_VIEWS } from '../../../common/constants';

const getEditableFormat = questions => {
  const editableQuestions = questions.map(question => {
    return { ...question, saved: true, draftID: uuid() };
  });
  return editableQuestions;
};

export function CreateQuestions() {
  const actions = useHMSActions();
  const { isHLSRunning } = useRecordingStreaming();
  const togglePollView = usePollViewToggle();
  const { pollInView: id, setPollView } = usePollViewState();
  const interaction = useHMSStore(selectPollByID(id));
  const [questions, setQuestions] = useState(
    interaction.questions?.length ? getEditableFormat(interaction.questions) : [{ draftID: uuid() }],
  );

  const isValidPoll = useMemo(() => questions.length > 0 && questions.every(isValidQuestion), [questions]);

  const launchPoll = async () => {
    await actions.interactivityCenter.startPoll(id);
    await sendTimedMetadata(id);
    setPollView(POLL_VIEWS.VOTE);
  };

  const sendTimedMetadata = async poll_id => {
    // send hls timedmetadata when it is running
    if (poll_id && isHLSRunning) {
      try {
        await actions.sendHLSTimedMetadata([
          {
            payload: `poll:${poll_id}`,
            duration: 100,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const headingTitle = interaction?.type
    ? interaction?.type?.[0]?.toUpperCase() + interaction?.type?.slice(1)
    : 'Polls and Quizzes';
  const isQuiz = interaction?.type === 'quiz';
  return (
    <Container rounded>
      <ContentHeader
        content={headingTitle}
        onClose={togglePollView}
        onBack={() => setPollView(POLL_VIEWS.CREATE_POLL_QUIZ)}
      />
      <Flex direction="column" css={{ p: '10', overflowY: 'auto' }}>
        <Flex direction="column">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.draftID}
              question={question}
              index={index}
              length={questions.length}
              onSave={async questionParams => {
                const updatedQuestions = [...questions.slice(0, index), questionParams, ...questions.slice(index + 1)];
                setQuestions(updatedQuestions);
                const validQuestions = updatedQuestions.filter(question => isValidQuestion(question));
                await actions.interactivityCenter.addQuestionsToPoll(id, validQuestions);
              }}
              isQuiz={isQuiz}
              removeQuestion={async questionID => {
                const updatedQuestions = questions.filter(questionFromSet => questionID !== questionFromSet?.draftID);
                setQuestions(updatedQuestions);
                const validQuestions = updatedQuestions.filter(question => isValidQuestion(question));
                await actions.interactivityCenter.addQuestionsToPoll(id, validQuestions);
              }}
              convertToDraft={questionID =>
                setQuestions(prev => {
                  const copyOfQuestions = [...prev];
                  copyOfQuestions.forEach(question => {
                    if (questionID && question.draftID === questionID) {
                      question.saved = false;
                    }
                  });
                  return copyOfQuestions;
                })
              }
            />
          ))}
        </Flex>
        <Flex
          css={{
            c: 'onSurface.low',
            my: 'sm',
            cursor: 'pointer',
            '&:hover': { c: 'onSurface.medium' },
          }}
          onClick={() => setQuestions([...questions, { draftID: uuid() }])}
        >
          <AddCircleIcon />
          <Text variant="body1" css={{ ml: 'md', c: '$inherit' }}>
            Add another question
          </Text>
        </Flex>
        <Flex css={{ w: '100%' }} justify="end">
          <Button disabled={!isValidPoll} onClick={async () => launchPoll()}>
            Launch {interaction?.type}
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
}

const QuestionCard = ({ question, onSave, index, length, removeQuestion, isQuiz, convertToDraft }) => {
  return (
    <Flex direction="column" css={{ p: 'md', bg: 'surface.default', r: '1', mb: 'sm' }}>
      {question.saved ? (
        <SavedQuestion question={question} index={index} length={length} convertToDraft={convertToDraft} />
      ) : (
        <QuestionForm
          question={question}
          removeQuestion={() => removeQuestion(question.draftID)}
          onSave={params => onSave(params)}
          index={index}
          length={length}
          isQuiz={isQuiz}
        />
      )}
    </Flex>
  );
};
