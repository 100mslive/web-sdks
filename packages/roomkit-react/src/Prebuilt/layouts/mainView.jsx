import React, { Suspense, useCallback, useEffect } from 'react';
import {
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import FullPageProgress from '../components/FullPageProgress';
import { GridLayout } from '../components/VideoLayouts/GridLayout';
import { Flex } from '../../Layout';
import { EmbedView } from './EmbedView';
import { PDFView } from './PDFView';
import SidePane from './SidePane';
import { WaitingView } from './WaitingView';
import { useWhiteboardMetadata } from '../plugins/whiteboard';
import {
  useHLSViewerRole,
  usePDFAnnotator,
  useSetAppDataByKey,
  useUrlToEmbed,
  useWaitingViewerRole,
} from '../components/AppData/useUISettings';
import { useShowStreamingUI } from '../common/hooks';
import { APP_DATA, SESSION_STORE_KEY } from '../common/constants';

// const WhiteboardView = React.lazy(() => import("./WhiteboardView"));
const HLSView = React.lazy(() => import('./HLSView'));

export const ConferenceMainView = () => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const { whiteboardOwner: whiteboardShared } = useWhiteboardMetadata();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const hlsViewerRole = useHLSViewerRole();
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
      if (error.message === 'beam already started') {
        return;
      }
      if (error.message.includes('invalid input')) {
        await startHLS();
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
    const audioPlaylist = JSON.parse(process.env.REACT_APP_AUDIO_PLAYLIST || '[]');
    const videoPlaylist = JSON.parse(process.env.REACT_APP_VIDEO_PLAYLIST || '[]');
    if (videoPlaylist.length > 0) {
      hmsActions.videoPlaylist.setList(videoPlaylist);
    }
    if (audioPlaylist.length > 0) {
      hmsActions.audioPlaylist.setList(audioPlaylist);
    }

    hmsActions.sessionStore.observe([SESSION_STORE_KEY.PINNED_MESSAGE, SESSION_STORE_KEY.SPOTLIGHT]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, hmsActions]);

  if (!localPeerRole) {
    // we don't know the role yet to decide how to render UI
    return null;
  }

  let ViewComponent;
  if (localPeerRole === hlsViewerRole) {
    ViewComponent = HLSView;
  } else if (localPeerRole === waitingViewerRole) {
    ViewComponent = WaitingView;
  } else if (pdfAnnotatorActive) {
    ViewComponent = PDFView;
  } else if (urlToIframe) {
    ViewComponent = EmbedView;
  } else if (whiteboardShared) {
    // ViewComponent = WhiteboardView;
  } else {
    ViewComponent = GridLayout;
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
        <ViewComponent />
        <SidePane />
      </Flex>
    </Suspense>
  );
};
