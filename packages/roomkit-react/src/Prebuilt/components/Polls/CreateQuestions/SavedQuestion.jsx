// @ts-check
import React, { useState } from 'react';
import { CheckCircleIcon, TrashIcon } from '@100mslive/react-icons';
import { Box, Button, Flex, Text } from '../../../../';
import { DeleteQuestionModal } from './DeleteQuestionModal';
import { QUESTION_TYPE_TITLE } from '../../../common/constants';

export const SavedQuestion = ({ question, index, length, convertToDraft, removeQuestion }) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  return (
    <>
      <Text variant="overline" css={{ c: '$on_surface_low', textTransform: 'uppercase' }}>
        Question {index + 1} of {length}: {QUESTION_TYPE_TITLE[question.type]}
      </Text>
      <Text variant="body2" css={{ mt: '$4', mb: '$md' }}>
        {question.text}
      </Text>
      {question.options.map(option => (
        <Flex css={{ alignItems: 'center', my: '$xs' }}>
          <Text variant="body2" css={{ c: '$on_surface_medium' }}>
            {option.text}
          </Text>
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
      <Flex justify="between" css={{ w: '100%', alignItems: 'center' }}>
        <Box
          onClick={() => setOpenDeleteModal(true)}
          css={{ color: '$on_surface_low', '&:hover': { color: '$on_surface_medium', cursor: 'pointer' } }}
        >
          <TrashIcon />
        </Box>
        <Button
          variant="standard"
          css={{ fontWeight: '$semiBold', p: '$4 $8' }}
          onClick={() => convertToDraft(question.draftID)}
        >
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
