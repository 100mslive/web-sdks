import React from 'react';
import { selectAppData, selectVideoTrackByPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Chat } from '../components/Chat/Chat';
import { ParticipantList } from '../components/Footer/ParticipantList';
import { StreamingLanding } from '../components/Streaming/StreamingLanding';
import VideoTile from '../components/VideoTile';
import { Box, Flex } from '../../Layout';
import { APP_DATA, SIDE_PANE_OPTIONS } from '../common/constants';

const SidePane = ({ css = {} }) => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const trackId = useHMSStore(selectVideoTrackByPeerID(activeScreensharePeerId))?.id;
  let ViewComponent;
  if (sidepane === SIDE_PANE_OPTIONS.PARTICIPANTS) {
    ViewComponent = ParticipantList;
  } else if (sidepane === SIDE_PANE_OPTIONS.CHAT) {
    ViewComponent = Chat;
  } else if (sidepane === SIDE_PANE_OPTIONS.STREAMING) {
    ViewComponent = StreamingLanding;
  }
  if (!ViewComponent && !activeScreensharePeerId) {
    return null;
  }
  return (
    <Flex direction="column" justify="center" css={{ w: '$100', h: '100%', flexShrink: 0 }}>
      {trackId && (
        <VideoTile
          peerId={activeScreensharePeerId}
          trackId={trackId}
          width="100%"
          height={225}
          rootCSS={{ p: 0, alignSelf: 'start', flexShrink: 0 }}
          objectFit="contain"
        />
      )}
      {!!ViewComponent && (
        <Box
          direction="column"
          css={{
            flex: '1 1 0',
            minHeight: 0,
            w: '100%',
            p: '$10',
            bg: '$surface_default',
            r: '$1',
            position: 'relative',
            ...css,
            '@lg': {
              w: '100%',
              h: '100%',
              ml: 0,
              right: 0,
              position: 'fixed',
              bottom: 0,
              r: 0,
              zIndex: 10,
              ...(css['@lg'] || {}),
            },
          }}
        >
          <ViewComponent />
        </Box>
      )}
    </Flex>
  );
};

export default SidePane;
