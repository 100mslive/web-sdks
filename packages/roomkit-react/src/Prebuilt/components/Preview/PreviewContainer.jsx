import React from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';
import { HMSRoomState, selectRoomState, useHMSStore } from '@100mslive/react-sdk';
import { Box, Flex } from '../../../';
import { useHMSPrebuiltContext } from '../../AppContext';
import SidePane from '../../layouts/SidePane';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
import FullPageProgress from '../FullPageProgress';
import { Header } from '../Header';
import PreviewJoin from './PreviewJoin';
import { useAuthToken } from '../AppData/useUISettings';
import { useNavigation } from '../hooks/useNavigation';
import { useSkipPreview } from '../hooks/useSkipPreview';
import { QUERY_PARAM_PREVIEW_AS_ROLE } from '../../common/constants';

const PreviewContainer = () => {
  const navigate = useNavigation();
  const skipPreview = useSkipPreview();
  const previewAsRole = useSearchParam(QUERY_PARAM_PREVIEW_AS_ROLE);
  const { userName } = useHMSPrebuiltContext();
  const initialName = userName || (skipPreview ? 'Beam' : '');
  const { roomId: urlRoomId, role: userRole } = useParams(); // from the url
  const authToken = useAuthToken();
  const roomLayout = useRoomLayout();
  const { preview_header: previewHeader = {} } = roomLayout?.screens?.preview?.default?.elements || {};

  const roomState = useHMSStore(selectRoomState);
  const isPreview = roomState === HMSRoomState.Preview;

  const onJoin = () => {
    let meetingURL = `/meeting/${urlRoomId}`;
    if (userRole) {
      meetingURL += `/${userRole}`;
    }
    navigate(meetingURL);
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
        {authToken && Object.keys(previewHeader).length > 0 ? (
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
