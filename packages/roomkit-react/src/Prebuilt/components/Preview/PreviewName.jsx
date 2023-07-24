import React, { useCallback } from 'react';
import { useMedia } from 'react-use';
import { selectAppData, useHMSActions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { ArrowRightIcon, RadioIcon } from '@100mslive/react-icons';
import { Button, config as cssConfig, Flex, Input, styled } from '../../../';
import { PreviewSettings } from './PreviewJoin';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA } from '../../common/constants';

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
  // Value to be part of layout API
  const showStreamingUI = true;
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);
  const hmsActions = useHMSActions();
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const recordingUrl = useHMSStore(selectAppData(APP_DATA.recordingUrl));
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted) {
        return;
      }
      setHLSStarted(true);
      await hmsActions.startHLSStreaming({});
    } catch (error) {
      if (error.message.includes('invalid input')) {
        await startHLS();
        return;
      }
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSStarted, setHLSStarted, recordingUrl]);

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
          if (showStreamingUI && !(cannotPublishAudio || cannotPublishVideo)) {
            // Better way to do this?
            setTimeout(() => startHLS(), 300);
            window.sessionStorage.setItem('userStartedStream', 'true');
          }
        }}
      >
        {/* Conditions to show go live: The first broadcaster joins a streaming kit */}
        {showStreamingUI && !(isHLSRunning || isRTMPRunning) && !(cannotPublishAudio || cannotPublishVideo) ? (
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
