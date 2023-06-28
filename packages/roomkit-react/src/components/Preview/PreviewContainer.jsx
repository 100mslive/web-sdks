import React from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';
import SidePane from '../../layouts/SidePane';
import { Box, Flex, Loading } from '../baseComponents';
import { Header } from '../Header';
import PreviewJoin from './PreviewJoin';
import { useAuthToken } from '../AppData/useUISettings';
import { useNavigation } from '../hooks/useNavigation';
import { useSkipPreview } from '../hooks/useSkipPreview';
import {
  QUERY_PARAM_NAME,
  QUERY_PARAM_PREVIEW_AS_ROLE,
} from '../../common/constants';

const PreviewContainer = () => {
  const navigate = useNavigation();
  const skipPreview = useSkipPreview();
  const previewAsRole = useSearchParam(QUERY_PARAM_PREVIEW_AS_ROLE);
  const initialName =
    useSearchParam(QUERY_PARAM_NAME) || (skipPreview ? 'Beam' : '');
  const { roomId: urlRoomId, role: userRole } = useParams(); // from the url
  const authToken = useAuthToken();

  const onJoin = () => {
    let meetingURL = `/meeting/${urlRoomId}`;
    if (userRole) {
      meetingURL += `/${userRole}`;
    }
    navigate(meetingURL);
  };
  return (
    <Flex direction="column" css={{ size: '100%' }}>
      <Box
        css={{ h: '$18', '@md': { h: '$17', flexShrink: 0 } }}
        data-testid="header"
      >
        <Header />
      </Box>
      <Flex
        css={{ flex: '1 1 0', position: 'relative', overflowY: 'auto' }}
        justify="center"
        align="center"
      >
        {authToken ? (
          <PreviewJoin
            initialName={initialName}
            skipPreview={skipPreview}
            asRole={previewAsRole}
            onJoin={onJoin}
          />
        ) : (
          <Loading size={100} />
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
