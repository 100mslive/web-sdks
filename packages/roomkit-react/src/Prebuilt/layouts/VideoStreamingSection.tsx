import React, { Suspense, useEffect } from 'react';
import { useMedia } from 'react-use';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { match } from 'ts-pattern';
import { selectIsConnectedToRoom, selectLocalPeerRoleName, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import FullPageProgress from '../components/FullPageProgress';
import { GridLayout } from '../components/VideoLayouts/GridLayout';
import { Box, Flex } from '../../Layout';
import { config } from '../../Theme';
// @ts-ignore: No implicit Any
import { EmbedView } from './EmbedView';
// @ts-ignore: No implicit Any
import { PDFView } from './PDFView';
import SidePane from './SidePane';
// @ts-ignore: No implicit Any
import { WaitingView } from './WaitingView';
import { CaptionsViewer } from '../plugins/CaptionsViewer';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen } from '../components/AppData/useSidepane';
import {
  useIsCaptionEnabled,
  usePDFConfig,
  useUrlToEmbed,
  useWaitingViewerRole,
  // @ts-ignore: No implicit Any
} from '../components/AppData/useUISettings';
import { useCloseScreenshareWhiteboard } from '../components/hooks/useCloseScreenshareWhiteboard';
import { useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
import { SESSION_STORE_KEY, SIDE_PANE_OPTIONS } from '../common/constants';
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

  const hmsActions = useHMSActions();
  const waitingViewerRole = useWaitingViewerRole();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFConfig();
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeHLSStream = useLandscapeHLSStream();
  useCloseScreenshareWhiteboard();
  const isCaptionEnabled = useIsCaptionEnabled();
  const isMobile = useMedia(config.media.md);
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);

  const showCaptionAtTop = elements?.chat?.is_overlay && isChatOpen && isMobile;

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

  return (
    <Suspense fallback={<FullPageProgress />}>
      <Flex
        css={{
          size: '100%',
          position: 'relative',
          gap: isMobileHLSStream || isLandscapeHLSStream ? '0' : '$4',
        }}
        direction={match<Record<string, boolean>, 'row' | 'column'>({ isLandscapeHLSStream, isMobileHLSStream })
          .with({ isLandscapeHLSStream: true }, () => 'row')
          .with({ isMobileHLSStream: true }, () => 'column')
          .otherwise(() => 'row')}
      >
        {match({ screenType, localPeerRole, pdfAnnotatorActive, urlToIframe })
          .with(
            {
              screenType: 'hls_live_streaming',
            },
            () => <HLSView />,
          )
          .when(
            ({ localPeerRole }) => localPeerRole === waitingViewerRole,
            () => <WaitingView />,
          )
          .when(
            ({ pdfAnnotatorActive }) => !!pdfAnnotatorActive,
            () => <PDFView />,
          )
          .when(
            ({ urlToIframe }) => !!urlToIframe,
            () => <EmbedView />,
          )

          .otherwise(() => {
            // @ts-ignore
            return <GridLayout {...(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid} />;
          })}
        {isCaptionEnabled && screenType !== 'hls_live_streaming' && (
          <Box
            css={{
              position: 'absolute',
              w: isMobile ? '100%' : '40%',
              bottom: showCaptionAtTop ? '' : '0',
              top: showCaptionAtTop ? '0' : '',
              left: isMobile ? 0 : '50%',
              transform: isMobile ? '' : 'translateX(-50%)',
              background: '#000000A3',
              overflow: 'clip',
              zIndex: 10,
              height: 'fit-content',
              r: '$1',
              p: '$6',
              transition: 'bottom 0.3s ease-in-out',
              '&:empty': { display: 'none' },
            }}
          >
            <CaptionsViewer />
          </Box>
        )}
        <Box
          css={{
            flex: match({ isLandscapeHLSStream, isMobileHLSStream })
              .with({ isLandscapeHLSStream: true }, () => '1  1 0')
              .with({ isMobileHLSStream: true }, () => '2 1 0')
              .otherwise(() => undefined),
            position: 'relative',
            height: !isMobileHLSStream ? '100%' : undefined,
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
