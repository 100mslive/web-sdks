import React from 'react';
import { useMedia } from 'react-use';
import { selectAppData, selectVideoTrackByPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Chat } from '../components/Chat/Chat';
import { ParticipantList } from '../components/Footer/ParticipantList';
import { StreamingLanding } from '../components/Streaming/StreamingLanding';
import VideoTile from '../components/VideoTile';
import { Box, Flex } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { useIsLocalPeerHLSViewer, useShowStreamingUI } from '../common/hooks';
import { APP_DATA, SIDE_PANE_OPTIONS } from '../common/constants';

const SidePane = ({ css = {} }) => {
  const isMobile = useMedia(cssConfig.media.md);
  const showStreamingUI = useShowStreamingUI();
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const trackId = useHMSStore(selectVideoTrackByPeerID(activeScreensharePeerId))?.id;
  const isHLSViewer = useIsLocalPeerHLSViewer();
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

  const mwebStreamingChat = isMobile && (showStreamingUI || isHLSViewer) && ViewComponent === Chat;

  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        w: '$100',
        h: '100%',
        flexShrink: 0,
        '@md': { position: mwebStreamingChat ? 'absolute' : '', zIndex: 21 },
      }}
    >
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
          css={{
            w: '$100',
            h: mwebStreamingChat ? '0' : '100%',
            p: '$10',
            maxHeight: mwebStreamingChat ? '300px' : 'unset',
            background: mwebStreamingChat
              ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 35.94%, rgba(0, 0, 0, 0.64) 100%)'
              : '$surface_dim',
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
            '@md': {
              p: '$6 $8',
              pb: mwebStreamingChat ? '$20' : '$12',
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
