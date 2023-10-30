import React, { useEffect, useRef, useState } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import {
  HMSRoomState,
  selectAppData,
  selectIsConnectedToRoom,
  selectRoomState,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Footer } from './Footer/Footer';
import { HLSFailureModal } from './Notifications/HLSFailureModal';
// @ts-ignore: No implicit Any
import { ActivatedPIP } from './PIP/PIPComponent';
// @ts-ignore: No implicit Any
import { RoleChangeRequestModal } from './RoleChangeRequest/RoleChangeRequestModal';
import { Box, Flex } from '../../Layout';
import { useHMSPrebuiltContext } from '../AppContext';
import { VideoStreamingSection } from '../layouts/VideoStreamingSection';
// @ts-ignore: No implicit Any
import FullPageProgress from './FullPageProgress';
import { Header } from './Header';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useAuthToken, useSetAppDataByKey } from './AppData/useUISettings';
// @ts-ignore: No implicit Any
import { APP_DATA, isAndroid, isIOS, isIPadOS } from '../common/constants';

export const ConferenceScreen = () => {
  const { userName, endpoints } = useHMSPrebuiltContext();
  const screenProps = useRoomLayoutConferencingScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const roomState = useHMSStore(selectRoomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const [hideControls, setHideControls] = useState(false);
  const dropdownList = useHMSStore(selectAppData(APP_DATA.dropdownList));
  const authTokenInAppData = useAuthToken();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const isMobileDevice = isAndroid || isIOS || isIPadOS;
  const dropdownListRef = useRef<string[]>();
  const [isHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const toggleControls = () => {
    if (dropdownListRef.current?.length === 0 && isMobileDevice) {
      setHideControls(value => !value);
    }
  };
  const autoRoomJoined = useRef(isPreviewScreenEnabled);

  useEffect(() => {
    let timeout: undefined | ReturnType<typeof setTimeout>;
    dropdownListRef.current = dropdownList || [];
    if (dropdownListRef.current && dropdownListRef.current.length === 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (dropdownListRef.current && dropdownListRef.current.length === 0) {
          setHideControls(isMobileDevice);
        }
      }, 5000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [dropdownList, hideControls, isMobileDevice]);

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
          userName: userName || '',
          authToken: authTokenInAppData,
          initEndpoint: endpoints?.init,
          settings: {
            isAudioMuted: !isPreviewScreenEnabled,
            isVideoMuted: !isPreviewScreenEnabled,
            speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
          },
        })
        .catch(console.error);
      autoRoomJoined.current = true;
    }
  }, [authTokenInAppData, endpoints?.init, hmsActions, isConnectedToRoom, isPreviewScreenEnabled, roomState, userName]);

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
        {!screenProps.hideSections.includes('header') && (
          <Box
            ref={headerRef}
            css={{
              h: '$18',
              transition: 'margin 0.3s ease-in-out',
              marginTop: hideControls ? `-${headerRef.current?.clientHeight}px` : 'none',
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
          onClick={toggleControls}
        >
          {screenProps.elements ? (
            <VideoStreamingSection
              screenType={screenProps.screenType}
              elements={screenProps.elements}
              hideControls={hideControls}
            />
          ) : null}
        </Box>
        {!screenProps.hideSections.includes('footer') && screenProps.elements && (
          <Box
            ref={footerRef}
            css={{
              flexShrink: 0,
              maxHeight: '$24',
              transition: 'margin 0.3s ease-in-out',
              bg: '$background_dim',
              marginBottom: hideControls ? `-${footerRef.current?.clientHeight}px` : undefined,
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
        <RoleChangeRequestModal />
        <HLSFailureModal />
        <ActivatedPIP />
      </Flex>
    </>
  );
};
