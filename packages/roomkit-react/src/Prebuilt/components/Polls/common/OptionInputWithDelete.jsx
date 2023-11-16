import React from 'react';
import { TrashIcon } from '@100mslive/react-icons';
import { Input } from '../../../../Input';
import IconButton from '../../../IconButton';

export const OptionInputWithDelete = ({ index, option, handleOptionTextChange, removeOption }) => {
  return (
    <>
      <Input
        placeholder={`Option ${index + 1}`}
        css={{
          w: '100%',
          backgroundColor: '$surface_default',
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
