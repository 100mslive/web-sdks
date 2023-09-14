import React, { Fragment, Suspense, useCallback, useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import {
  HMSRoomState,
  selectIsLocalVideoEnabled,
  selectLocalPeer,
  selectRoomState,
  selectVideoTrackByID,
  useAVToggle,
  useHMSStore,
  useParticipants,
  usePreviewJoin,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { MicOffIcon, SettingsIcon } from '@100mslive/react-icons';
import { Avatar, Box, config as cssConfig, Flex, flexCenter, styled, StyledVideoTile, Text, Video } from '../../..';
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { AudioVideoToggle } from '../AudioVideoToggle';
// @ts-ignore: No implicit Any
import Chip from '../Chip';
// @ts-ignore: No implicit Any
import TileConnection from '../Connection/TileConnection';
// @ts-ignore: No implicit Any
import FullPageProgress from '../FullPageProgress';
// @ts-ignore: No implicit Any
import { Logo } from '../Header/HeaderComponents';
// @ts-ignore: No implicit Any
import SettingsModal from '../Settings/SettingsModal';
// @ts-ignore: No implicit Any
import { AudioLevel } from '../VideoTile';
// @ts-ignore: No implicit Any
import PreviewForm from './PreviewForm';
// @ts-ignore: No implicit Any
import { useAuthToken, useUISettings } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { defaultPreviewPreference, UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';
// @ts-ignore: No implicit Any
import { UI_SETTINGS } from '../../common/constants';

// @ts-ignore: No implicit Any
const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

const getParticipantChipContent = (peerCount = 0) => {
  if (peerCount === 0) {
    return 'You are the first to join';
  }
  const formattedNum = getFormattedCount(peerCount);
  return `${formattedNum} other${parseInt(formattedNum) === 1 ? '' : 's'} in the session`;
};

const PreviewJoin = ({
  onJoin,
  skipPreview,
  initialName,
  asRole,
}: {
  onJoin: () => void;
  skipPreview?: boolean;
  initialName?: string;
  asRole?: string;
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
  const { enableJoin, preview, join } = usePreviewJoin({
    name,
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
  const roomState = useHMSStore(selectRoomState);

  const savePreferenceAndJoin = useCallback(() => {
    setPreviewPreference({
      name,
    });
    join();
    onJoin && onJoin();
  }, [join, name, setPreviewPreference, onJoin]);
  const roomLayout = useRoomLayout();

  const { preview_header: previewHeader = {} } = roomLayout?.screens?.preview?.default?.elements || {};

  useEffect(() => {
    if (authToken) {
      if (skipPreview) {
        savePreferenceAndJoin();
      } else {
        preview();
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
    <Container css={{ h: '100%', pt: '$10', '@md': { justifyContent: 'space-between' } }}>
      {toggleVideo ? null : <Box />}
      <Flex direction="column" justify="center" css={{ w: '100%', maxWidth: '640px' }}>
        <Logo />
        <Text
          variant="h4"
          css={{ wordBreak: 'break-word', textAlign: 'center', mt: '$14', mb: '$4', '@md': { mt: '$8', mb: '$2' } }}
        >
          {previewHeader.title}
        </Text>
        <Text
          css={{ c: '$on_surface_medium', my: '0', textAlign: 'center', maxWidth: '100%', wordWrap: 'break-word' }}
          variant="sm"
        >
          {previewHeader.sub_title}
        </Text>
        <Flex justify="center" css={{ mt: '$14', '@md': { mt: '$8', mb: '0' }, gap: '$4' }}>
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
      {toggleVideo ? (
        <Flex
          align="center"
          justify="center"
          css={{
            mt: '$14',
            '@md': { mt: 0 },
            '@sm': { width: '100%' },
            flexDirection: 'column',
          }}
        >
          <PreviewTile name={name} error={previewError} />
        </Flex>
      ) : null}
      <Box css={{ w: '100%', maxWidth: '640px' }}>
        <PreviewControls hideSettings={!toggleVideo && !toggleAudio} />
        <PreviewForm
          name={name}
          onChange={setName}
          enableJoin={enableJoin}
          onJoin={savePreferenceAndJoin}
          cannotPublishVideo={!toggleVideo}
          cannotPublishAudio={!toggleAudio}
        />
      </Box>
    </Container>
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
  const { isLocalAudioEnabled, toggleAudio } = useAVToggle();
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const showMuteIcon = !isLocalAudioEnabled || !toggleAudio;
  const videoTrack = useHMSStore(selectVideoTrackByID(localPeer?.videoTrack));
  const isMobile = useMedia(cssConfig.media.md);
  const aspectRatio =
    videoTrack?.width && videoTrack?.height ? videoTrack.width / videoTrack.height : isMobile ? 9 / 16 : 16 / 9;
  return (
    <StyledVideoTile.Container
      css={{
        bg: '$surface_default',
        aspectRatio,
        height: 'min(360px, 70vh)',
        maxWidth: '640px',
        overflow: 'clip',
        '@md': {
          width: 'min(220px, 70vw)',
          maxWidth: '100%',
          my: '$4',
        },
      }}
    >
      {localPeer ? (
        <>
          <TileConnection name={name} peerId={localPeer.id} hideLabel={true} />
          <Video
            mirror={track?.facingMode !== 'environment' && mirrorLocalVideo}
            trackId={localPeer.videoTrack}
            data-testid="preview_tile"
          />
          {!isVideoOn ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar name={name} data-testid="preview_avatar_tile" />
            </StyledVideoTile.AvatarContainer>
          ) : null}
        </>
      ) : !error ? (
        <FullPageProgress />
      ) : null}
      {showMuteIcon ? (
        <StyledVideoTile.AudioIndicator size="medium">
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      ) : (
        <AudioLevel trackId={localPeer?.audioTrack} />
      )}
    </StyledVideoTile.Container>
  );
};

export const PreviewControls = ({ hideSettings }: { hideSettings: boolean }) => {
  const isMobile = useMedia(cssConfig.media.md);

  return (
    <Flex
      justify="between"
      css={{
        width: '100%',
        mt: '$8',
      }}
    >
      <Flex css={{ gap: '$4' }}>
        <AudioVideoToggle />
        <Suspense fallback="">{!isMobile ? <VirtualBackground /> : null}</Suspense>
      </Flex>
      {!hideSettings ? <PreviewSettings /> : null}
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
