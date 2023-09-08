import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrevious } from 'react-use';
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
import { ActivatedPIP } from './PIP/PIPComponent';
import { PictureInPicture } from './PIP/PIPManager';
import { Box, Flex } from '../../Layout';
import { useHMSPrebuiltContext } from '../AppContext';
import { VideoStreamingSection } from '../layouts/VideoStreamingSection';
import FullPageProgress from './FullPageProgress';
import { Header } from './Header';
import { RoleChangeRequestModal } from './RoleChangeRequestModal';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useAuthToken, useSetAppDataByKey } from './AppData/useUISettings';
import { APP_DATA, isAndroid, isIOS, isIPadOS } from '../common/constants';

const Conference = () => {
  const navigate = useNavigate();
  const { roomId, role } = useParams();
  const { userName, endpoints } = useHMSPrebuiltContext();
  const screenProps = useRoomLayoutConferencingScreen();
  const { isPreviewScreenEnabled } = useRoomLayoutPreviewScreen();
  const roomState = useHMSStore(selectRoomState);
  const prevState = usePrevious(roomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const [hideControls, setHideControls] = useState(false);
  const dropdownList = useHMSStore(selectAppData(APP_DATA.dropdownList));
  const authTokenInAppData = useAuthToken();
  const headerRef = useRef();
  const footerRef = useRef();
  const isMobileDevice = isAndroid || isIOS || isIPadOS;
  const dropdownListRef = useRef();
  const [isHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const toggleControls = () => {
    if (dropdownListRef.current?.length === 0 && isMobileDevice) {
      setHideControls(value => !value);
    }
  };

  useEffect(() => {
    let timeout = null;
    dropdownListRef.current = dropdownList || [];
    if (dropdownListRef.current.length === 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (dropdownListRef.current.length === 0) {
          setHideControls(isMobileDevice);
        }
      }, 5000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [dropdownList, hideControls, isMobileDevice]);

  useEffect(() => {
    if (!roomId) {
      navigate(`/`);
      return;
    }
    if (!isPreviewScreenEnabled) {
      return;
    }
    if (
      !prevState &&
      !(roomState === HMSRoomState.Connecting || roomState === HMSRoomState.Reconnecting || isConnectedToRoom)
    ) {
      if (role) navigate(`/preview/${roomId || ''}/${role}`);
      else navigate(`/preview/${roomId || ''}`);
    }
  }, [isConnectedToRoom, prevState, roomState, navigate, role, roomId, isPreviewScreenEnabled]);

  useEffect(() => {
    if (authTokenInAppData && !isConnectedToRoom && !isPreviewScreenEnabled && roomState !== HMSRoomState.Connecting) {
      hmsActions
        .join({
          userName,
          authToken: authTokenInAppData,
          initEndpoint: endpoints?.init,
          initialSettings: {
            isAudioMuted: !isPreviewScreenEnabled,
            isVideoMuted: !isPreviewScreenEnabled,
            speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
          },
        })
        .catch(console.error);
    }
  }, [authTokenInAppData, endpoints?.init, hmsActions, isConnectedToRoom, isPreviewScreenEnabled, roomState, userName]);

  useEffect(() => {
    return () => {
      PictureInPicture.stop().catch(error => console.error('stopping pip', error));
    };
  }, []);

  if (!isConnectedToRoom) {
    return <FullPageProgress text="Joining..." />;
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
            <Header elements={screenProps.elements} screenType={screenProps.screenType} />
          </Box>
        )}
        <Box
          css={{
            w: '100%',
            flex: '1 1 0',
            minHeight: 0,
            px: screenProps?.elements?.video_tile_layout?.grid?.edge_to_edge ? 0 : '$10', // TODO: padding to be controlled by section/element
            paddingBottom: 'env(safe-area-inset-bottom)',
            '@lg': {
              px: 0,
            },
          }}
          id="conferencing"
          data-testid="conferencing"
          onClick={toggleControls}
        >
          <VideoStreamingSection
            screenType={screenProps.screenType}
            elements={screenProps.elements}
            hideControls={hideControls}
          />
        </Box>
        {!screenProps.hideSections.includes('footer') && (
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

export default Conference;
