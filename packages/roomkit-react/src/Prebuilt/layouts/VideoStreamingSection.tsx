import React, { Suspense, useEffect } from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { match } from 'ts-pattern';
import {
  selectIsConnectedToRoom,
  selectIsLocalScreenShared,
  selectLocalPeerRole,
  selectLocalPeerRoleName,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { PeopleAddIcon, ShareScreenIcon } from '@100mslive/react-icons';
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
import { CaptionsViewer } from '../plugins/CaptionsViewer';
// @ts-ignore: No implicit Any
import {
  usePDFConfig,
  useUrlToEmbed,
  // @ts-ignore: No implicit Any
} from '../components/AppData/useUISettings';
import { useCloseScreenshareWhiteboard } from '../components/hooks/useCloseScreenshareWhiteboard';
import { useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
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
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  const localPeerRole = useHMSStore(selectLocalPeerRole);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isSharingScreen = useHMSStore(selectIsLocalScreenShared);

  const hmsActions = useHMSActions();
  const urlToIframe = useUrlToEmbed();
  const pdfAnnotatorActive = usePDFConfig();
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeHLSStream = useLandscapeHLSStream();
  useCloseScreenshareWhiteboard();

  const isNotAllowedToPublish = localPeerRole?.publishParams?.allowed.length === 0;
  const isScreenOnlyPublishParams = localPeerRole?.publishParams?.allowed.some(value => value === 'screen');

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

  if (!localPeerRoleName) {
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
        {match({
          screenType,
          isNotAllowedToPublish,
          isScreenOnlyPublishParams,
          isSharingScreen,
          pdfAnnotatorActive,
          urlToIframe,
        })
          .with(
            {
              screenType: 'hls_live_streaming',
            },
            () => <HLSView />,
          )
          .when(
            ({ isNotAllowedToPublish }) => isNotAllowedToPublish,
            () => (
              <WaitingView
                title="Waiting for Host to join"
                subTitle="Sit back and relax"
                icon={<PeopleAddIcon width="56px" height="56px" style={{ color: 'white' }} />}
              />
            ),
          )
          .when(
            ({ isScreenOnlyPublishParams, isSharingScreen }) => isScreenOnlyPublishParams && !isSharingScreen,
            () => (
              <WaitingView
                title="Ready to present"
                subTitle="Select the Screenshare button to start presenting"
                icon={<ShareScreenIcon width="56px" height="56px" style={{ color: 'white' }} />}
              />
            ),
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
        <CaptionsViewer />
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
