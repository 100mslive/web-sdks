import React from 'react';
import { ArrowRightIcon, RadioIcon } from '@100mslive/react-icons';
import { Button, Input, styled } from '../../../';
import { isStreamingKit } from '../../common/utils';

const PreviewName = ({ name, onChange, onJoin, enableJoin }) => {
  const formSubmit = e => {
    e.preventDefault();
  };
  const showStreamingUI = isStreamingKit();
  return (
    <Form onSubmit={formSubmit}>
      <Input
        required
        id="name"
        css={{ w: '100%' }}
        value={name}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter your name"
        autoFocus
        autoComplete="name"
      />
      <Button type="submit" icon disabled={!name || !enableJoin} onClick={onJoin}>
        {/* TODO: Go Live should also start the stream */}
        {showStreamingUI ? (
          <>
            <RadioIcon />
            Go Live
          </>
        ) : (
          <>
            Join Now <ArrowRightIcon />
          </>
        )}
      </Button>
    </Form>
  );
};

const Form = styled('form', {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '$4',
  mt: '$10',
  mb: '$10',
});

export default PreviewName;
