import React, { useEffect } from 'react';
import { match } from 'ts-pattern';
import { selectAppData, selectVideoTrackByPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Polls } from '../components/Polls/Polls';
import { RoomDetailsPane } from '../components/RoomDetails/RoomDetailsPane';
import { LayoutMode } from '../components/Settings/LayoutSettings';
import { SidePaneTabs } from '../components/SidePaneTabs';
import { TileCustomisationProps } from '../components/VideoLayouts/GridLayout';
import VideoTile from '../components/VideoTile';
import { VBPicker } from '../components/VirtualBackground/VBPicker';
import { Flex } from '../../Layout';
import { config as cssConfig, styled } from '../../Theme';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../components/AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useUISettings } from '../components/AppData/useUISettings';
import { useContainerQuery } from '../components/hooks/useContainerQuery';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
import { translateAcross } from '../../utils';
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS } from '../common/constants';

const Wrapper = styled('div', {
  w: '$100',
  h: '100%',
  p: '$10',
  flex: '1 1 0',
  background: '$surface_dim',
  r: '$1',
  position: 'relative',
  '@lg': {
    w: '100%',
    h: '100%',
    ml: 0,
    right: 0,
    position: 'fixed',
    bottom: 0,
    borderRadius: 0,
    zIndex: 10,
  },
  '@md': {
    p: '$6 $8',
    animation: `${translateAcross({ yFrom: '100%' })} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
  },
  variants: {
    landscapeStream: {
      true: {
        '@lg': {
          position: 'unset',
          minHeight: '100%',
        },
      },
    },
    mobileStream: {
      true: {
        '@md': {
          position: 'unset',
        },
      },
    },
    overlayChat: {
      true: {
        '@lg': {
          maxHeight: '300px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 35.94%, rgba(0, 0, 0, 0.64) 100%)',
          position: 'fixed',
          zIndex: 12,
          bottom: 0,
        },
      },
    },
    roomDescription: {
      true: {
        overflowY: 'auto',
      },
    },
    hideControls: {
      true: {},
    },
    virtualBackground: {
      true: {
        maxHeight: '100%',
        background: '$surface_dim',
      },
    },
  },
  compoundVariants: [
    {
      landscapeStream: true,
      overlayChat: true,
      css: {
        position: 'unset',
        height: '100%',
        maxHeight: 'unset',
        '@md': {
          pb: 0,
        },
      },
    },
    {
      mobileStream: true,
      overlayChat: true,
      css: {
        position: 'unset',
        height: '100%',
        maxHeight: 'unset',
      },
    },
    {
      hideControls: false,
      overlayChat: true,
      css: {
        pb: '$17',
      },
    },
  ],
});

const SidePane = ({
  tileProps,
  hideControls = false,
}: {
  tileProps?: TileCustomisationProps;
  hideControls?: boolean;
}) => {
  const isMobile = useContainerQuery(cssConfig.media.md);
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const trackId = useHMSStore(selectVideoTrackByPeerID(activeScreensharePeerId))?.id;
  const { elements } = useRoomLayoutConferencingScreen();
  const { elements: preview_elements } = useRoomLayoutPreviewScreen();
  const layoutMode = useUISettings(UI_SETTINGS.layoutMode);

  const isLandscapeHLSStream = useLandscapeHLSStream();
  const isMobileHLSStream = useMobileHLSStream();

  const backgroundMedia = preview_elements?.virtual_background?.background_media?.length
    ? preview_elements?.virtual_background?.background_media
    : elements?.virtual_background?.background_media || [];

  const tileLayout = {
    hideParticipantNameOnTile: tileProps?.hide_participant_name_on_tile,
    roundedVideoTile: tileProps?.rounded_video_tile,
    hideAudioMuteOnTile: tileProps?.hide_audio_mute_on_tile,
    hideMetadataOnTile: tileProps?.hide_metadata_on_tile,
    objectFit: tileProps?.video_object_fit,
  };
  const mwebStreamingChat = isMobile && sidepane === SIDE_PANE_OPTIONS.CHAT && elements?.chat?.is_overlay;
  const commonProps = {
    landscapeStream: isLandscapeHLSStream,
    mobileStream: isMobileHLSStream,
    hideControls,
    overlayChat: !!elements?.chat?.is_overlay,
    roomDescription: sidepane === SIDE_PANE_OPTIONS.ROOM_DETAILS,
    virtualBackground: sidepane === SIDE_PANE_OPTIONS.VB,
  };

  const SidepaneComponent = match(sidepane)
    .with(SIDE_PANE_OPTIONS.POLLS, () => (
      <Wrapper
        css={{
          '@md': {
            borderTopLeftRadius: '$2',
            borderTopRightRadius: '$2',
          },
        }}
        {...commonProps}
      >
        <Polls />
      </Wrapper>
    ))
    .with(SIDE_PANE_OPTIONS.VB, () => (
      <Wrapper css={{ p: '$10 $6 $10 $10' }} {...commonProps}>
        <VBPicker backgroundMedia={backgroundMedia} />
      </Wrapper>
    ))
    .with(SIDE_PANE_OPTIONS.CHAT, SIDE_PANE_OPTIONS.PARTICIPANTS, () => (
      <Wrapper {...commonProps} overlayChat={mwebStreamingChat}>
        <SidePaneTabs active={sidepane} hideTab={isMobileHLSStream || isLandscapeHLSStream} />
      </Wrapper>
    ))
    .with(SIDE_PANE_OPTIONS.ROOM_DETAILS, () => (
      <Wrapper {...commonProps}>
        <RoomDetailsPane />
      </Wrapper>
    ))
    .otherwise(() => {
      return null;
    });

  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    return () => {
      resetSidePane();
    };
  }, [resetSidePane]);

  if (!SidepaneComponent && !trackId) {
    return null;
  }

  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        w: match({ isMobileHLSStream, isLandscapeHLSStream })
          .with({ isLandscapeHLSStream: true }, () => '340px')
          .with({ isMobileHLSStream: true }, () => '100%')
          .otherwise(() => '$100'),
        h: '100%',
        flexShrink: 0,
        gap: '$4',
        position: 'relative',
        '&:empty': { display: 'none' },
        '@md': {
          position: 'absolute',
          zIndex: 12,
        },
      }}
    >
      {trackId && layoutMode === LayoutMode.GALLERY && (
        <VideoTile
          peerId={activeScreensharePeerId}
          trackId={trackId}
          width="100%"
          height={225}
          rootCSS={{ p: 0, alignSelf: 'start', flexShrink: 0 }}
          {...tileLayout}
        />
      )}
      {SidepaneComponent}
    </Flex>
  );
};

export default SidePane;
