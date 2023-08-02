import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';
import {
  HMSRoomState,
  selectPermissions,
  selectRoomState,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { Box, Flex } from '../../../';
import SidePane from '../../layouts/SidePane';
import FullPageProgress from '../FullPageProgress';
import { Header } from '../Header';
import PreviewJoin from './PreviewJoin';
import { useAuthToken, useSetAppDataByKey } from '../AppData/useUISettings';
import { useNavigation } from '../hooks/useNavigation';
import { useSkipPreview } from '../hooks/useSkipPreview';
import { APP_DATA, QUERY_PARAM_NAME, QUERY_PARAM_PREVIEW_AS_ROLE, sampleLayout } from '../../common/constants';

const PreviewContainer = () => {
  const navigate = useNavigation();
  const skipPreview = useSkipPreview();
  const previewAsRole = useSearchParam(QUERY_PARAM_PREVIEW_AS_ROLE);
  const initialName = useSearchParam(QUERY_PARAM_NAME) || (skipPreview ? 'Beam' : '');
  const { roomId: urlRoomId, role: userRole } = useParams(); // from the url
  const authToken = useAuthToken();

  const roomState = useHMSStore(selectRoomState);
  const isPreview = roomState === HMSRoomState.Preview;
  const hmsActions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  const { isHLSRunning } = useRecordingStreaming();
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const { join_form: joinForm } = sampleLayout.screens.preview.live_streaming.elements;
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
  }, [hmsActions, isHLSStarted, setHLSStarted]);

  const onJoin = () => {
    let meetingURL = `/meeting/${urlRoomId}`;
    if (userRole) {
      meetingURL += `/${userRole}`;
    }
    navigate(meetingURL);
    if (permissions?.hlsStreaming && !isHLSRunning && joinForm.join_btn_type === 1) {
      startHLS();
      console.log('called');
    }
  };
  return (
    <Flex direction="column" css={{ size: '100%' }}>
      {isPreview ? null : (
        <Box css={{ h: '$18', '@md': { h: '$17', flexShrink: 0 } }} data-testid="header">
          <Header />
        </Box>
      )}
      <Flex
        css={{ flex: '1 1 0', position: 'relative', overflowY: 'auto', color: '$primary_default' }}
        justify="center"
        align="center"
      >
        {authToken ? (
          <PreviewJoin initialName={initialName} skipPreview={skipPreview} asRole={previewAsRole} onJoin={onJoin} />
        ) : (
          <FullPageProgress />
        )}
        <SidePane
          css={{
            position: 'unset',
            mr: '$10',
            '@lg': { position: 'fixed', mr: '$0' },
          }}
        />
      </Flex>
    </Flex>
  );
};

export default PreviewContainer;
