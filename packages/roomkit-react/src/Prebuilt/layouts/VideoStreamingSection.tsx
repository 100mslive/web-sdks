import React, { Suspense, useEffect } from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import {
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectPeerScreenSharing,
  selectWhiteboard,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import FullPageProgress from '../components/FullPageProgress';
import { GridLayout } from '../components/VideoLayouts/GridLayout';
import { Box, Flex } from '../../Layout';
// @ts-ignore: No implicit Any
import { EmbedView } from './EmbedView';
// @ts-ignore: No implicit Any
import { PDFView } from './PDFView';
import SidePane from './SidePane';
// @ts-ignore: No implicit Any
import { WaitingView } from './WaitingView';
import { WhiteboardView } from './WhiteboardView';
import {
  usePDFConfig,
  useUrlToEmbed,
  useWaitingViewerRole,
  // @ts-ignore: No implicit Any
} from '../components/AppData/useUISettings';
import { useCloseScreenshareWhiteboard } from '../components/hooks/useCloseScreenshareWhiteboard';
import { useMobileHLSStream } from '../common/hooks';
// @ts-ignore: No implicit Any
import { SESSION_STORE_KEY } from '../common/constants';

// @ts-ignore: No implicit Any
const HLSView = React.lazy(() => import('./HLSView'));

export const VideoStreamingSection = ({
  screenType,
  elements,
  hideControls = false,
}: {
  screenType: keyof ConferencingScreen;
  elements: DefaultConferencingScreen_Elements | HLSLiveStreamingScreen_Elements;
  hideControls: boolean;
}) => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const isWhiteboardOpen = useHMSStore(selectWhiteboard)?.open;

  const hmsActions = useHMSActions();
  const waitingViewerRole = useWaitingViewerRole();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFConfig();
  const isMobileHLSStream = useMobileHLSStream();
  useCloseScreenshareWhiteboard();

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    hmsActions.sessionStore.observe([
      SESSION_STORE_KEY.PINNED_MESSAGES,
      SESSION_STORE_KEY.SPOTLIGHT,
      SESSION_STORE_KEY.CHAT_STATE,
      SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST,
      SESSION_STORE_KEY.CHAT_PEER_BLACKLIST,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, hmsActions]);

  if (!localPeerRole) {
    // we don't know the role yet to decide how to render UI
    return null;
  }

  let ViewComponent;
  if (screenType === 'hls_live_streaming') {
    ViewComponent = <HLSView />;
  } else if (localPeerRole === waitingViewerRole) {
    ViewComponent = <WaitingView />;
  } else if (pdfAnnotatorActive) {
    ViewComponent = <PDFView />;
  } else if (urlToIframe) {
    ViewComponent = <EmbedView />;
  } else if (peerSharing) {
    // screen share should take preference over whiteboard
    //@ts-ignore
    ViewComponent = <GridLayout {...(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid} />;
  } else if (isWhiteboardOpen) {
    ViewComponent = <WhiteboardView />;
  } else {
    //@ts-ignore
    ViewComponent = <GridLayout {...(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid} />;
  }

  return (
    <Suspense fallback={<FullPageProgress />}>
      <Flex
        css={{
          size: '100%',
          position: 'relative',
          gap: '$4',
        }}
        direction={isMobileHLSStream ? 'column' : 'row'}
      >
        {ViewComponent}
        <Box
          css={{
            height: isMobileHLSStream ? '50%' : '100%',
            maxHeight: '100%',
            '&:empty': { display: 'none' },
            overflowY: 'clip',
          }}
        >
          <SidePane
            screenType={screenType}
            // @ts-ignore
            tileProps={(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid}
            hideControls={hideControls}
          />
        </Box>
      </Flex>
    </Suspense>
  );
};
