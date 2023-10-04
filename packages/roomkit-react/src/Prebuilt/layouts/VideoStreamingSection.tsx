import React, { Suspense, useEffect } from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { selectIsConnectedToRoom, selectLocalPeerRoleName, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import FullPageProgress from '../components/FullPageProgress';
import { GridLayout } from '../components/VideoLayouts/GridLayout';
import { Flex } from '../../Layout';
// @ts-ignore: No implicit Any
import { EmbedView } from './EmbedView';
// @ts-ignore: No implicit Any
import { PDFView } from './PDFView';
import SidePane from './SidePane';
// @ts-ignore: No implicit Any
import { WaitingView } from './WaitingView';
// import { useWhiteboardMetadata } from '../plugins/whiteboard';
import {
  usePDFConfig,
  useUrlToEmbed,
  useWaitingViewerRole,
  // @ts-ignore: No implicit Any
} from '../components/AppData/useUISettings';
// @ts-ignore: No implicit Any
import { SESSION_STORE_KEY } from '../common/constants';

// const WhiteboardView = React.lazy(() => import("./WhiteboardView"));
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
  // const { whiteboardOwner: whiteboardShared } = useWhiteboardMetadata();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const waitingViewerRole = useWaitingViewerRole();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFConfig();

  console.log('use pdf annotator ', pdfAnnotatorActive);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    hmsActions.sessionStore.observe([SESSION_STORE_KEY.PINNED_MESSAGE, SESSION_STORE_KEY.SPOTLIGHT]);
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
      >
        {ViewComponent}
        <SidePane
          screenType={screenType}
          // @ts-ignore
          tileProps={(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid}
          hideControls={hideControls}
        />
      </Flex>
    </Suspense>
  );
};
