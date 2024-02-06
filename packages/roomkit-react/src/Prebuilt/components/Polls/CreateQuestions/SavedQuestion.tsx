import React from 'react';
import { HMSPollQuestion } from '@100mslive/react-sdk';
import { CheckCircleIcon } from '@100mslive/react-icons';
import { Button, Flex, Text } from '../../../../';
import { QUESTION_TYPE_TITLE } from '../../../common/constants';

export const SavedQuestion = ({
  question,
  index,
  length,
  convertToDraft,
}: {
  question: HMSPollQuestion & { draftID: number };
  index: number;
  length: number;
  convertToDraft: (draftID: number) => void;
}) => {
  return (
    <>
      <Text variant="overline" css={{ c: '$on_surface_low', textTransform: 'uppercase' }}>
        {/* @ts-ignore */}
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
      <Flex justify="end" css={{ w: '100%', alignItems: 'center' }}>
        <Button variant="standard" css={{ fontWeight: '$semiBold' }} onClick={() => convertToDraft(question.draftID)}>
          Edit
        </Button>
      </Flex>
    </>
  );
};
