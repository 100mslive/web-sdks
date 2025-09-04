import React from 'react';
import { useMedia } from 'react-use';
import { JoinForm_JoinBtnType } from '@100mslive/types-prebuilt/elements/join_form';
import { useRecordingStreaming } from '@100mslive/react-sdk';
import { GoLiveIcon } from '@100mslive/react-icons';
import { Button, config as cssConfig, Flex, Input, styled } from '../../..';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { PreviewSettings } from './PreviewJoin';

const PreviewForm = ({
  name,
  disabled,
  onChange,
  onJoin,
  enableJoin,
  cannotPublishVideo = false,
  cannotPublishAudio = false,
}: {
  name: string;
  disabled?: boolean;
  onChange: (name: string) => void;
  onJoin: () => void;
  enableJoin: boolean;
  cannotPublishVideo: boolean;
  cannotPublishAudio: boolean;
}) => {
  const formSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };
  const isMobile = useMedia(cssConfig.media.md);
  const { isHLSRunning, isRTMPRunning, isHLSRecordingOn, isBrowserRecordingOn } = useRecordingStreaming();

  const layout = useRoomLayout();
  const { join_form: joinForm = {} } = layout?.screens?.preview?.default?.elements || {};

  const showGoLive =
    joinForm?.join_btn_type === JoinForm_JoinBtnType.JOIN_BTN_TYPE_JOIN_AND_GO_LIVE &&
    !isHLSRunning &&
    !isRTMPRunning &&
    !isHLSRecordingOn &&
    !isBrowserRecordingOn;

  return (
    <Form
      css={{ flexDirection: cannotPublishVideo ? 'column' : 'row', '@md': { flexDirection: 'row' } }}
      onSubmit={formSubmit}
    >
      <Flex align="center" css={{ gap: '$8', w: '100%' }}>
        <Input
          required
          id="name"
          disabled={disabled}
          css={{ w: '100%', boxSizing: 'border-box' }}
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value.trimStart())}
          placeholder="Enter name"
          autoFocus
          autoComplete="name"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && name.trim().length > 0) {
              e.preventDefault();
              if (isMobile) {
                return;
              }
              onJoin();
            }
          }}
        />
        {cannotPublishAudio && cannotPublishVideo && !isMobile ? <PreviewSettings /> : null}
      </Flex>

      <Button type="submit" icon disabled={!name || !enableJoin} onClick={onJoin}>
        {/* Conditions to show go live: The first broadcaster joins a streaming kit that is not live */}
        {showGoLive ? <GoLiveIcon height={18} width={18} /> : null}
        {showGoLive ? joinForm.go_live_btn_label : joinForm.join_btn_label}
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
