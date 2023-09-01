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
import { useAuthToken, useIsHeadless, useSetAppDataByKey } from './AppData/useUISettings';
import { APP_DATA, EMOJI_REACTION_TYPE, isAndroid, isIOS, isIPadOS } from '../common/constants';

const Conference = () => {
  const navigate = useNavigate();
  const { roomId, role } = useParams();
  const isHeadless = useIsHeadless();
  const { userName } = useHMSPrebuiltContext();
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
  const dropdownListRef = useRef();
  const performAutoHide = hideControls && (isAndroid || isIOS || isIPadOS);
  const [isHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const toggleControls = () => {
    if (dropdownListRef.current?.length === 0) {
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
          setHideControls(true);
        }
      }, 5000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [dropdownList, hideControls]);

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
          initEndpoint: process.env.REACT_APP_ENV
            ? `https://${process.env.REACT_APP_ENV}-init.100ms.live/init`
            : undefined,
          initialSettings: {
            isAudioMuted: !isPreviewScreenEnabled,
            isVideoMuted: !isPreviewScreenEnabled,
            speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
          },
        })
        .catch(console.error);
    }
  }, [authTokenInAppData, hmsActions, isConnectedToRoom, isPreviewScreenEnabled, roomState, userName]);

  useEffect(() => {
    // beam doesn't need to store messages, saves on unnecessary store updates in large calls
    if (isHeadless) {
      hmsActions.ignoreMessageTypes(['chat', EMOJI_REACTION_TYPE]);
    }
  }, [isHeadless, hmsActions]);

  useEffect(() => {
    return () => {
      PictureInPicture.stop().catch(error => console.error('stopping pip', error));
    };
  }, []);

  if (!isConnectedToRoom) {
    return <FullPageProgress loadingText="Joining..." />;
  }

  if (isHLSStarted) {
    return <FullPageProgress loadingText="Starting live stream..." />;
  }

  return (
    <Flex css={{ size: '100%', overflow: 'hidden' }} direction="column">
      {!screenProps.hideSections.includes('header') && (
        <Box
          ref={headerRef}
          css={{
            h: '$18',
            transition: 'margin 0.3s ease-in-out',
            marginTop: performAutoHide ? `-${headerRef.current?.clientHeight}px` : 'none',
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
          px: '$10',
          paddingBottom: 'env(safe-area-inset-bottom)',
          '@lg': {
            px: 0,
          },
        }}
        id="conferencing"
        data-testid="conferencing"
        onClick={toggleControls}
      >
        <VideoStreamingSection screenType={screenProps.screenType} elements={screenProps.elements} />
      </Box>
      {!screenProps.hideSections.includes('footer') && (
        <Box
          ref={footerRef}
          css={{
            flexShrink: 0,
            maxHeight: '$24',
            transition: 'margin 0.3s ease-in-out',
            bg: '$background_dim',
            marginBottom: performAutoHide ? `-${footerRef.current?.clientHeight}px` : undefined,
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
  );
};

export default Conference;
