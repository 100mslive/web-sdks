import React, { Suspense, useCallback, useEffect } from 'react';
import { HMSException } from '@100mslive/hms-video';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import {
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import FullPageProgress from '../components/FullPageProgress';
// @ts-ignore: No implicit Any
import { GridLayout } from '../components/VideoLayouts/GridLayout';
import { Flex } from '../../Layout';
// @ts-ignore: No implicit Any
import { EmbedView } from './EmbedView';
// @ts-ignore: No implicit Any
import { PDFView } from './PDFView';
// @ts-ignore: No implicit Any
import SidePane from './SidePane';
// @ts-ignore: No implicit Any
import { WaitingView } from './WaitingView';
// import { useWhiteboardMetadata } from '../plugins/whiteboard';
import {
  usePDFAnnotator,
  useSetAppDataByKey,
  useUrlToEmbed,
  useWaitingViewerRole,
  // @ts-ignore: No implicit Any
} from '../components/AppData/useUISettings';
// @ts-ignore: No implicit Any
import { useShowStreamingUI } from '../common/hooks';
// @ts-ignore: No implicit Any
import { APP_DATA, SESSION_STORE_KEY } from '../common/constants';

// const WhiteboardView = React.lazy(() => import("./WhiteboardView"));
// @ts-ignore: No implicit Any
const HLSView = React.lazy(() => import('./HLSView'));

export const ConferenceMainView = ({
  screenType,
  elements,
}: {
  screenType: keyof ConferencingScreen;
  elements: DefaultConferencingScreen_Elements | HLSLiveStreamingScreen_Elements;
}) => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  // const { whiteboardOwner: whiteboardShared } = useWhiteboardMetadata();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const waitingViewerRole = useWaitingViewerRole();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFAnnotator();
  const { isHLSRunning } = useRecordingStreaming();
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const permissions = useHMSStore(selectPermissions);
  const showStreamingUI = useShowStreamingUI();

  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted) {
        return;
      }
      setHLSStarted(true);
      await hmsActions.startHLSStreaming({});
    } catch (error) {
      if ((error as HMSException).message === 'beam already started') {
        return;
      }
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSStarted, setHLSStarted]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    // Is a streaming kit and broadcaster joins
    if (permissions?.hlsStreaming && !isHLSRunning && showStreamingUI) {
      startHLS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

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
    ViewComponent = <GridLayout {...(elements as DefaultConferencingScreen_Elements).video_tile_layout?.grid} />;
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
        <SidePane />
      </Flex>
    </Suspense>
  );
};
