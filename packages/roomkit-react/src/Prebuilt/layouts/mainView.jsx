import React, { Suspense, useCallback, useEffect } from 'react';
import {
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectPeerScreenSharing,
  selectPeerSharingAudio,
  selectPeerSharingVideoPlaylist,
  selectPermissions,
  selectTemplateAppData,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import FullPageProgress from '../components/FullPageProgress';
import { Flex } from '../../Layout';
import { useRoomLayout } from '../provider/roomLayoutProvider';
import { EmbedView } from './EmbedView';
import { InsetView } from './InsetView';
import { MainGridView } from './mainGridView';
import { PDFView } from './PDFView';
import ScreenShareView from './screenShareView';
import SidePane from './SidePane';
import { WaitingView } from './WaitingView';
import { useWhiteboardMetadata } from '../plugins/whiteboard';
import { useAppConfig } from '../components/AppData/useAppConfig';
import {
  useHLSViewerRole,
  useIsHeadless,
  usePDFAnnotator,
  usePinnedTrack,
  useSetAppDataByKey,
  useUISettings,
  useUrlToEmbed,
  useWaitingViewerRole,
} from '../components/AppData/useUISettings';
import { showStreamingUI } from '../common/utils';
import { APP_DATA, SESSION_STORE_KEY, UI_MODE_ACTIVE_SPEAKER } from '../common/constants';

// const WhiteboardView = React.lazy(() => import("./WhiteboardView"));
const HLSView = React.lazy(() => import('./HLSView'));
const ActiveSpeakerView = React.lazy(() => import('./ActiveSpeakerView'));
const PinnedTrackView = React.lazy(() => import('./PinnedTrackView'));

export const ConferenceMainView = () => {
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const pinnedTrack = usePinnedTrack();
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const peerSharingAudio = useHMSStore(selectPeerSharingAudio);
  const peerSharingPlaylist = useHMSStore(selectPeerSharingVideoPlaylist);
  const { whiteboardOwner: whiteboardShared } = useWhiteboardMetadata();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const uiMode = useHMSStore(selectTemplateAppData).uiMode;
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();
  const headlessUIMode = useAppConfig('headlessConfig', 'uiMode');
  const { uiViewMode, isAudioOnly } = useUISettings();
  const hlsViewerRole = useHLSViewerRole();
  const waitingViewerRole = useWaitingViewerRole();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFAnnotator();
  const layout = useRoomLayout();
  const { isHLSRunning } = useRecordingStreaming();
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const permissions = useHMSStore(selectPermissions);

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

    // Is a streaming kit and broadcaster joins
    if (permissions?.hlsStreaming && !isHLSRunning && showStreamingUI(layout)) {
      // startHLS();
    }

    hmsActions.sessionStore.observe([SESSION_STORE_KEY.PINNED_MESSAGE, SESSION_STORE_KEY.SPOTLIGHT]);
  }, [isConnected, hmsActions, permissions]);

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
  } else if (uiMode === 'inset') {
    ViewComponent = InsetView;
  } else if (((peerSharing && peerSharing.id !== peerSharingAudio?.id) || peerSharingPlaylist) && !isAudioOnly) {
    ViewComponent = ScreenShareView;
  } else if (pinnedTrack) {
    ViewComponent = PinnedTrackView;
  } else if (uiViewMode === UI_MODE_ACTIVE_SPEAKER || (isHeadless && headlessUIMode === UI_MODE_ACTIVE_SPEAKER)) {
    ViewComponent = ActiveSpeakerView;
  } else {
    ViewComponent = MainGridView;
  }

  return (
    <Suspense fallback={<FullPageProgress />}>
      <Flex
        css={{
          size: '100%',
          position: 'relative',
        }}
      >
        <ViewComponent />
        <SidePane />
      </Flex>
    </Suspense>
  );
};
