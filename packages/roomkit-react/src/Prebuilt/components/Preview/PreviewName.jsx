import React from 'react';
import { ArrowRightIcon, RadioIcon } from '@100mslive/react-icons';
import { Button, Flex, Input, styled } from '../../../';
import { isStreamingKit } from '../../common/utils';
import { PreviewSettings } from './PreviewJoin';
import { config as cssConfig } from '../../../';
import { useMedia } from 'react-use';

const PreviewName = ({
  name,
  onChange,
  onJoin,
  enableJoin,
  cannotPublishVideo = false,
  cannotPublishAudio = false,
}) => {
  const formSubmit = e => {
    e.preventDefault();
  };
  const showStreamingUI = isStreamingKit();
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);
  return (
    <Form
      css={{ flexDirection: cannotPublishVideo ? 'column' : 'row', '@md': { flexDirection: 'row' } }}
      onSubmit={formSubmit}
    >
      <Flex align="center" css={{ gap: '$8', w: '100%' }}>
        <Input
          required
          id="name"
          css={{ w: '100%', boxSizing: 'border-box' }}
          value={name}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          autoComplete="name"
        />
        {cannotPublishAudio && cannotPublishVideo && !isMobile ? <PreviewSettings /> : null}
      </Flex>
      <Button type="submit" icon disabled={!name || !enableJoin} onClick={onJoin}>
        {/* TODO: Go Live should also start the stream */}
        {showStreamingUI ? (
          <>
            <RadioIcon height={18} width={18} />
            Go Live
          </>
        ) : (
          <>
            Join Now <ArrowRightIcon height={18} width={18} />
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
  gap: '$8',
  mt: '$10',
  mb: '$10',
  '@md': {
    gap: '$4',
  },
});

export default PreviewName;
