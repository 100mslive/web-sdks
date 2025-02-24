import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useMeasure, useMedia } from 'react-use';
import {
  HMSRoomState,
  selectAppData,
  selectIsLocalVideoEnabled,
  selectIsVBEnabled,
  selectLocalPeer,
  selectRoomState,
  selectVideoTrackByID,
  useAVToggle,
  useAwayNotifications,
  useHMSStore,
  useParticipants,
  usePreviewJoin,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { MicOffIcon, SettingsIcon } from '@100mslive/react-icons';
import { Avatar, Box, config as cssConfig, Flex, flexCenter, styled, StyledVideoTile, Text, Video } from '../../..';
import { AudioLevel } from '../../../AudioLevel';
import { useHMSPrebuiltContext } from '../../AppContext';
import IconButton from '../../IconButton';
import SidePane from '../../layouts/SidePane';
import { AudioVideoToggle, NoiseCancellation } from '../AudioVideoToggle';
import Chip from '../Chip';
import TileConnection from '../Connection/TileConnection';
import FullPageProgress from '../FullPageProgress';
// @ts-ignore: No implicit Any
import { Logo } from '../Header/HeaderComponents';
// @ts-ignore: No implicit Any
import SettingsModal from '../Settings/SettingsModal';
import { VBToggle } from '../VirtualBackground/VBToggle';
import PreviewForm from './PreviewForm';
import { useRoomLayoutPreviewScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import {
  useAuthToken,
  useUISettings,
  // @ts-ignore: No implicit Any
} from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { defaultPreviewPreference, UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
// @ts-ignore: No implicit Any
import { calculateAvatarAndAttribBoxSize, getFormattedCount, getMetadata } from '../../common/utils';
import { APP_DATA, UI_SETTINGS } from '../../common/constants';

const getParticipantChipContent = (peerCount = 0) => {
  if (peerCount === 0) {
    return 'You are the first to join';
  }
  const formattedNum = getFormattedCount(peerCount);
  return `${formattedNum} other${parseInt(formattedNum) === 1 ? '' : 's'} in the session`;
};

const useLocalTileAspectRatio = () => {
  const localPeer = useHMSStore(selectLocalPeer);
  const videoTrack = useHMSStore(selectVideoTrackByID(localPeer?.videoTrack));
  const isMobile = useMedia(cssConfig.media.md);
  let aspectRatio = 0;
  if (videoTrack?.width && videoTrack?.height) {
    aspectRatio = videoTrack.width / videoTrack.height;
  } else {
    aspectRatio = isMobile ? 9 / 16 : 16 / 9;
  }
  return aspectRatio.toString();
};

const PreviewJoin = ({
  skipPreview,
  initialName,
  asRole,
  metadata,
}: {
  skipPreview?: boolean;
  initialName?: string;
  asRole?: string;
  metadata?: string;
}) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(
    UserPreferencesKeys.PREVIEW,
    defaultPreviewPreference,
  );
  const { isStreamingOn } = useRecordingStreaming();
  const authToken = useAuthToken();
  const [name, setName] = useState(initialName || previewPreference.name);
  const { toggleAudio, toggleVideo } = useAVToggle();
  const [previewError, setPreviewError] = useState(false);
  const { endpoints } = useHMSPrebuiltContext();
  const { peerCount } = useParticipants();
  const loadingEffects = useHMSStore(selectAppData(APP_DATA.loadingEffects));
  const { enableJoin, preview, join } = usePreviewJoin({
    name,
    metadata,
    token: authToken,
    initEndpoint: endpoints?.init,
    initialSettings: {
      isAudioMuted: skipPreview || previewPreference.isAudioMuted,
      isVideoMuted: skipPreview || previewPreference.isVideoMuted,
      speakerAutoSelectionBlacklist: ['Yeti Stereo Microphone'],
    },
    captureNetworkQualityInPreview: true,
    handleError: (_, method) => {
      if (method === 'preview') {
        setPreviewError(true);
      }
    },
    asRole,
  });
  const { requestPermission } = useAwayNotifications();
  const roomState = useHMSStore(selectRoomState);
  const savePreferenceAndJoin = useCallback(() => {
    setPreviewPreference({
      name,
    });
    join();
  }, [join, name, setPreviewPreference]);
  const { elements = {} } = useRoomLayoutPreviewScreen();
  const { preview_header: previewHeader = {}, virtual_background } = elements || {};
  const aspectRatio = useLocalTileAspectRatio();

  useEffect(() => {
    if (authToken) {
      if (skipPreview) {
        savePreferenceAndJoin();
      } else {
        preview().then(() => requestPermission());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, skipPreview]);

  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  return roomState === HMSRoomState.Preview ? (
    <Flex justify="center" css={{ size: '100%', position: 'relative' }}>
      <Container css={{ h: '100%', pt: '$6', '@md': { justifyContent: 'space-between', pt: '$10' } }}>
        {toggleVideo ? null : <Box />}
        <Flex direction="column" justify="center" css={{ w: '100%', maxWidth: '600px', gap: '$8' }}>
          <Logo />
          <Text variant="h4" css={{ wordBreak: 'break-word', textAlign: 'center' }}>
            {previewHeader.title}
          </Text>
          <Text
            css={{ c: '$on_surface_medium', textAlign: 'center', maxWidth: '100%', wordWrap: 'break-word' }}
            variant="sm"
          >
            {previewHeader.sub_title}
          </Text>
          <Flex justify="center" css={{ gap: '$4' }}>
            {isStreamingOn ? (
              <Chip
                content="LIVE"
                backgroundColor="$alert_error_default"
                textColor="#FFF"
                icon={<Box css={{ h: '$sm', w: '$sm', backgroundColor: '$on_primary_high', borderRadius: '$round' }} />}
              />
            ) : null}
            <Chip content={getParticipantChipContent(peerCount)} hideIfNoContent />
          </Flex>
        </Flex>
        {toggleVideo ? <PreviewTile name={name} error={previewError} /> : null}
        <Box css={{ w: '100%', maxWidth: `${Math.max(parseFloat(aspectRatio), 1) * 340}px` }}>
          <PreviewControls hideSettings={!toggleVideo && !toggleAudio} vbEnabled={!!virtual_background} />
          <PreviewForm
            name={name}
            disabled={!!initialName}
            onChange={setName}
            enableJoin={enableJoin && !loadingEffects}
            onJoin={savePreferenceAndJoin}
            cannotPublishVideo={!toggleVideo}
            cannotPublishAudio={!toggleAudio}
          />
        </Box>
      </Container>
      <Box css={{ position: 'absolute', right: '0', top: 0, height: '100%', overflow: 'hidden' }}>
        <SidePane />
      </Box>
    </Flex>
  ) : (
    <FullPageProgress />
  );
};

const Container = styled('div', {
  width: '100%',
  ...flexCenter,
  flexDirection: 'column',
  px: '$10',
});

export const PreviewTile = ({ name, error }: { name: string; error?: boolean }) => {
  const localPeer = useHMSStore(selectLocalPeer);
  const { avatarImageUrl } = getMetadata(localPeer?.metadata);
  const { isLocalAudioEnabled, toggleAudio } = useAVToggle();
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const showMuteIcon = !isLocalAudioEnabled || !toggleAudio;
  const aspectRatio = useLocalTileAspectRatio();
  const [ref, { width: calculatedWidth, height: calculatedHeight }] = useMeasure<HTMLDivElement>();
  const [avatarSize, attribBoxSize] = useMemo(
    () => calculateAvatarAndAttribBoxSize(calculatedWidth, calculatedHeight),
    [calculatedWidth, calculatedHeight],
  );

  return (
    <StyledVideoTile.Container
      ref={ref}
      css={{
        bg: '$surface_default',
        aspectRatio,
        height: 'min(340px, 70vh)',
        width: 'auto',
        maxWidth: '600px',
        overflow: 'clip',
        mt: '$10',
        '@md': {
          mt: 0,
          width: 'min(220px, 70vw)',
          maxWidth: '100%',
          my: '$4',
        },
      }}
    >
      {localPeer ? (
        <>
          <TileConnection name="" peerId={localPeer.id} hideLabel={false} />
          <Video
            mirror={track?.facingMode !== 'environment' && mirrorLocalVideo}
            trackId={localPeer.videoTrack}
            data-testid="preview_tile"
          />

          {!isVideoOn ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar imageUrl={avatarImageUrl} name={name} data-testid="preview_avatar_tile" size={avatarSize} />
            </StyledVideoTile.AvatarContainer>
          ) : null}
        </>
      ) : null}
      {!localPeer && !error ? <FullPageProgress /> : null}

      {showMuteIcon ? (
        <StyledVideoTile.AudioIndicator size={attribBoxSize}>
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      ) : (
        <StyledVideoTile.AudioIndicator size={attribBoxSize}>
          <AudioLevel trackId={localPeer?.audioTrack} />
        </StyledVideoTile.AudioIndicator>
      )}
    </StyledVideoTile.Container>
  );
};

export const PreviewControls = ({ hideSettings, vbEnabled }: { hideSettings: boolean; vbEnabled: boolean }) => {
  const isMobile = useMedia(cssConfig.media.md);
  const isVBEnabledForUser = useHMSStore(selectIsVBEnabled);
  return (
    <Flex
      justify={hideSettings && isMobile ? 'center' : 'between'}
      css={{
        width: '100%',
        mt: '$6',
      }}
    >
      <Flex css={{ gap: '$4' }}>
        <AudioVideoToggle />
        {vbEnabled && isVBEnabledForUser ? <VBToggle /> : null}
      </Flex>
      <Flex align="center" gap="1">
        {isMobile && <NoiseCancellation iconOnly />}
        {!hideSettings ? <PreviewSettings /> : null}
      </Flex>
    </Flex>
  );
};

export const PreviewSettings = React.memo(() => {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <IconButton data-testid="preview_setting_btn" css={{ flexShrink: 0 }} onClick={() => setOpen(value => !value)}>
        <SettingsIcon />
      </IconButton>
      {open && <SettingsModal open={open} onOpenChange={setOpen} />}
    </Fragment>
  );
});

export default PreviewJoin;
