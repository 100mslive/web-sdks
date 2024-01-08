import React from 'react';
import { HMSPollQuestionOption } from '@100mslive/react-sdk';
import { TrashIcon } from '@100mslive/react-icons';
import { Input } from '../../../../Input';
// @ts-ignore
import IconButton from '../../../IconButton';

export const OptionInputWithDelete = ({
  index,
  option,
  handleOptionTextChange,
  removeOption,
}: {
  index: number;
  option: HMSPollQuestionOption;
  handleOptionTextChange: (index: number, value: string) => void;
  removeOption: (index: number) => void;
}) => {
  return (
    <>
      <Input
        placeholder={`Option ${index + 1}`}
        css={{
          w: '100%',
          backgroundColor: '$surface_bright',
          border: '1px solid $border_bright',
        }}
        value={option?.text || ''}
        key={index}
        onChange={event => handleOptionTextChange(index, event.target.value)}
      />
      <IconButton onClick={() => removeOption(index)} css={{ bg: '$transparent', border: 'none' }}>
        <TrashIcon />
      </IconButton>
    </>
  );
};
