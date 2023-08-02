import React from 'react';
import { useMedia } from 'react-use';
import { useRecordingStreaming } from '@100mslive/react-sdk';
import { RadioIcon } from '@100mslive/react-icons';
import { Button, config as cssConfig, Flex, Input, styled } from '../../..';
import { PreviewSettings } from './PreviewJoin';
import { sampleLayout } from '../../common/constants';

const PreviewForm = ({
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
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);
  const { isHLSRunning } = useRecordingStreaming();
  const { join_form: joinForm } = sampleLayout.screens.preview.live_streaming.elements;
  const showGoLive = joinForm.join_btn_type === 1 && !isHLSRunning;

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
      <Button
        type="submit"
        icon
        disabled={!name || !enableJoin}
        onClick={() => {
          onJoin();
        }}
      >
        {/* Conditions to show go live: The first broadcaster joins a streaming kit that is not live */}
        {showGoLive ? <RadioIcon height={18} width={18} /> : null}
        {showGoLive ? joinForm.join_btn_label : 'Join Now'}
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

export default PreviewForm;
