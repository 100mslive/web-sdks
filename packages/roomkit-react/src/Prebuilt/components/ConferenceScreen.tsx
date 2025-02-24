import React, { useEffect, useRef } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { v4 as uuid } from 'uuid';
import {
  HMSRoomState,
  selectIsConnectedToRoom,
  selectRoomState,
  useAwayNotifications,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Footer } from './Footer/Footer';
import { MoreSettings } from './MoreSettings/MoreSettings';
import { HLSFailureModal } from './Notifications/HLSFailureModal';
// @ts-ignore: No implicit Any
import { ActivatedPIP } from './PIP/PIPComponent';
// @ts-ignore: No implicit Any
import { PictureInPicture } from './PIP/PIPManager';
import { RoleChangeRequestModal } from './RoleChangeRequest/RoleChangeRequestModal';
import { Box, Flex } from '../../Layout';
import { useHMSPrebuiltContext } from '../AppContext';
import { VideoStreamingSection } from '../layouts/VideoStreamingSection';
// @ts-ignore: No implicit Any
import { EmojiReaction } from './EmojiReaction';
import FullPageProgress from './FullPageProgress';
import { Header } from './Header';
import { PreviousRoleInMetadata } from './PreviousRoleInMetadata';
import { RaiseHand } from './RaiseHand';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useAuthToken, useSetAppDataByKey } from './AppData/useUISettings';
import { useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
import { APP_DATA } from '../common/constants';

export const ConferenceScreen = () => {
  const { userName, metaData, endpoints, onJoin: onJoinFunc } = useHMSPrebuiltContext();
  const screenProps = useRoomLayoutConferencingScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const roomState = useHMSStore(selectRoomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();

  const authTokenInAppData = useAuthToken();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const [isHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const { requestPermission } = useAwayNotifications();

  // using it in hls stream to show action button when chat is disabled
  const showChat = !!screenProps.elements?.chat;
  const autoRoomJoined = useRef(isPreviewScreenEnabled);
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeHLSStream = useLandscapeHLSStream();
  const isMwebHLSStream = isMobileHLSStream || isLandscapeHLSStream;

  useEffect(() => {
    if (
      authTokenInAppData &&
      !isConnectedToRoom &&
      !isPreviewScreenEnabled &&
      roomState !== HMSRoomState.Connecting &&
      !autoRoomJoined.current
    ) {
      hmsActions
        .join({
          userName: userName || uuid(),
          metaData,
          authToken: authTokenInAppData,
          initEndpoint: endpoints?.init,
          rememberDeviceSelection: true,
          settings: {
            isAudioMuted: !isPreviewScreenEnabled,
            isVideoMuted: !isPreviewScreenEnabled,
            speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
          },
        })
        .then(() => requestPermission())
        .catch(console.error);
      autoRoomJoined.current = true;
    }
  }, [
    authTokenInAppData,
    endpoints?.init,
    hmsActions,
    isConnectedToRoom,
    isPreviewScreenEnabled,
    roomState,
    userName,
    metaData,
    requestPermission,
  ]);

  useEffect(() => {
    onJoinFunc?.();
    return () => {
      PictureInPicture.stop().catch((error: unknown) => console.error('stopping pip', (error as Error).message));
    };
  }, [onJoinFunc]);

  if (!isConnectedToRoom && ![HMSRoomState.Reconnecting, HMSRoomState.Disconnected].includes(roomState)) {
    return <FullPageProgress text={roomState === HMSRoomState.Connecting ? 'Joining...' : ''} />;
  }

  return (
    <>
      {isHLSStarted ? (
        <Box css={{ position: 'fixed', zIndex: 100, w: '100%', h: '100%', left: 0, top: 0 }}>
          <FullPageProgress text="Starting live stream..." css={{ opacity: 0.8, bg: '$background_dim' }} />
        </Box>
      ) : null}
      <Flex css={{ size: '100%', overflow: 'hidden' }} direction="column">
        {!(screenProps.hideSections.includes('header') || isMwebHLSStream) && (
          <Box
            ref={headerRef}
            css={{
              h: '$18',
              transition: 'margin 0.3s ease-in-out',
              marginTop: isMwebHLSStream ? `-${headerRef.current?.clientHeight}px` : 'none',
              '@md': {
                h: '$17',
              },
            }}
            data-testid="header"
          >
            <Header />
          </Box>
        )}
        <Box
          css={{
            w: '100%',
            flex: '1 1 0',
            minHeight: 0,
            // @ts-ignore
            px: (screenProps?.elements as DefaultConferencingScreen_Elements)?.video_tile_layout?.grid?.edge_to_edge
              ? 0
              : '$10', // TODO: padding to be controlled by section/element
            paddingBottom: 'env(safe-area-inset-bottom)',
            '@lg': {
              px: 0,
            },
          }}
          id="conferencing"
          data-testid="conferencing"
        >
          {screenProps.elements ? (
            <VideoStreamingSection
              screenType={screenProps.screenType}
              elements={screenProps.elements}
              hideControls={isMwebHLSStream}
            />
          ) : null}
        </Box>
        {!screenProps.hideSections.includes('footer') && screenProps.elements && !isMwebHLSStream && (
          <Box
            ref={footerRef}
            css={{
              flexShrink: 0,
              maxHeight: '$24',
              transition: 'margin 0.3s ease-in-out',
              bg: '$background_dim',
              marginBottom: isMwebHLSStream ? `-${footerRef.current?.clientHeight}px` : undefined,
              '@md': {
                maxHeight: 'unset',
                bg: screenProps.screenType === 'hls_live_streaming' ? 'transparent' : '$background_dim',
              },
            }}
            data-testid="footer"
          >
            <Footer elements={screenProps.elements} screenType={screenProps.screenType} />
          </Box>
        )}
        {isMwebHLSStream && !showChat && (
          <Flex
            css={{
              alignItems: 'center',
              pr: '$4',
              pb: '$4',
              position: 'relative',
            }}
            justify="end"
            gap="2"
          >
            <RaiseHand />
            <MoreSettings elements={screenProps.elements} screenType={screenProps.screenType} />
            <Box
              css={{
                position: 'absolute',
                bottom: '100%',
                mb: '$4',
              }}
            >
              <EmojiReaction />
            </Box>
          </Flex>
        )}
        <RoleChangeRequestModal />
        <HLSFailureModal />
        <ActivatedPIP />
        <PreviousRoleInMetadata />
      </Flex>
    </>
  );
};
