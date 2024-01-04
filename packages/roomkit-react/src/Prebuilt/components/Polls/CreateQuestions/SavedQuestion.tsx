import React, { useState } from 'react';
import { HMSPollQuestion } from '@100mslive/react-sdk';
import { CheckCircleIcon, TrashIcon } from '@100mslive/react-icons';
import { Button, Flex, Text } from '../../../../';
// @ts-ignore
import IconButton from '../../../IconButton';
import { DeleteQuestionModal } from './DeleteQuestionModal';
import { QUESTION_TYPE_TITLE } from '../../../common/constants';

export const SavedQuestion = ({
  question,
  index,
  length,
  convertToDraft,
  removeQuestion,
}: {
  question: HMSPollQuestion & { draftID: number };
  index: number;
  length: number;
  convertToDraft: (draftID: number) => void;
  removeQuestion: (draftID: number) => void;
}) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  return (
    <>
      <Text variant="overline" css={{ c: '$on_surface_low', textTransform: 'uppercase' }}>
        Question {index + 1} of {length}: {QUESTION_TYPE_TITLE[question.type]}
      </Text>
      <Text variant="body2" css={{ mt: '$4', mb: '$md' }}>
        {question.text}
      </Text>
      {question.options?.map((option, index) => (
        <Flex key={`${option.text}-${index}`} css={{ alignItems: 'center', my: '$xs' }}>
          <Text variant="body2" css={{ c: '$on_surface_medium' }}>
            {option.text}
          </Text>
          {/* @ts-ignore */}
          {option.isCorrectAnswer && (
            <Flex css={{ color: '$alert_success', mx: '$xs' }}>
              <CheckCircleIcon height={24} width={24} />
            </Flex>
          )}
        </Flex>
      ))}
      {question.skippable ? (
        <Text variant="sm" css={{ color: '$on_surface_low', my: '$md' }}>
          Not required to answer
        </Text>
      ) : null}
      <Flex justify="end" css={{ w: '100%', alignItems: 'center', gap: '$4' }}>
        <IconButton onClick={() => setOpenDeleteModal(true)} css={{ background: 'none' }}>
          <TrashIcon />
        </IconButton>
        <Button variant="standard" css={{ fontWeight: '$semiBold' }} onClick={() => convertToDraft(question.draftID)}>
          Edit
        </Button>
      </Flex>
      <DeleteQuestionModal
        removeQuestion={() => removeQuestion(question.draftID)}
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
      />
    </>
  );
};
