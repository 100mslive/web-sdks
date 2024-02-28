import React, { Suspense, useEffect } from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { match } from 'ts-pattern';
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
        {match({ screenType, localPeerRole, pdfAnnotatorActive, urlToIframe, peerSharing, isWhiteboardOpen })
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
          .with({ pdfAnnotatorActive: true }, () => <PDFView />)
          .when(
            ({ urlToIframe }) => !!urlToIframe,
            () => <EmbedView />,
          )
          .when(
            ({ peerSharing }) => !!peerSharing,
            () => {
              // @ts-ignore
              return <GridLayout {...(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid} />;
            },
          )
          .when(
            ({ isWhiteboardOpen }) => !!isWhiteboardOpen,
            () => <WhiteboardView />,
          )
          .otherwise(() => {
            // @ts-ignore
            return <GridLayout {...(elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid} />;
          })}

        <Box
          css={{
            flex: isMobileHLSStream ? '1 1 0' : undefined,
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
