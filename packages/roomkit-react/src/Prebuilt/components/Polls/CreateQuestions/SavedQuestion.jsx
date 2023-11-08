// @ts-check
import React, { useState } from 'react';
import { CheckCircleIcon, ChevronDownIcon, TrashIcon } from '@100mslive/react-icons';
import { Box, Button, Flex, Text } from '../../../../';
import IconButton from '../../../IconButton';
import { DeleteQuestionModal } from './DeleteQuestionModal';
import { QUESTION_TYPE_TITLE } from '../../../common/constants';

export const SavedQuestion = ({ question, index, length, convertToDraft, removeQuestion }) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      <Text variant="overline" css={{ c: '$on_surface_low', textTransform: 'uppercase' }}>
        Question {index + 1} of {length}: {QUESTION_TYPE_TITLE[question.type]}
      </Text>
      <Flex justify="between" css={{ w: '100%' }}>
        <Text variant="body2" css={{ mt: '$4', mb: '$md', maxWidth: 'calc(100% - 16px)' }}>
          {question.text}
        </Text>
        <Box
          css={{ pt: '$4', color: '$on_surface_medium', '&:hover': { color: '$on_surface_high', cursor: 'pointer' } }}
          onClick={() => setShowOptions(prev => !prev)}
        >
          <ChevronDownIcon
            style={{ transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          />
        </Box>
      </Flex>
      <Box css={{ maxHeight: showOptions ? '$80' : '0', transition: 'max-height 0.3s ease', overflow: 'hidden' }}>
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
      </Box>
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
