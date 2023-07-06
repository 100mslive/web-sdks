import { useCallback, useState } from 'react';
import { v4 } from 'uuid';
import { HMSPollCreateParams, HMSPollQuestionCreateParams } from '@100mslive/hms-video-store';
import { useHMSActions } from '../primitives/HmsRoomProvider';

export const usePoll = ({ id = v4(), ...pollParams }: HMSPollCreateParams) => {
  const actions = useHMSActions();
  const [questions, setQuestions] = useState<HMSPollQuestionCreateParams[]>([]);

  const create = useCallback(async () => {
    await actions.interactivityCenter.createPoll({ id, ...pollParams });
  }, [actions, id, pollParams]);

  const start = useCallback(async () => {
    await actions.interactivityCenter.addQuestionsToPoll(id, questions);

    await actions.interactivityCenter.startPoll(id);
  }, [actions, questions, id]);

  const saveQuestion = useCallback(
    (questionParams: HMSPollQuestionCreateParams) => {
      const index = questions.length + 1;
      setQuestions([...questions, { ...questionParams, index }]);
    },
    [questions, setQuestions],
  );

  return { create, start, saveQuestion };
};
