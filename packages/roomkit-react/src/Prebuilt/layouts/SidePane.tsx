import React, { useEffect } from 'react';
import { useMedia } from 'react-use';
import { match } from 'ts-pattern';
import { selectAppData, selectVideoTrackByPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Polls } from '../components/Polls/Polls';
import { RoomDetailsPane } from '../components/RoomDetails/RoomDetailsPane';
import { LayoutMode } from '../components/Settings/LayoutSettings';
import { SidePaneTabs } from '../components/SidePaneTabs';
import { TileCustomisationProps } from '../components/VideoLayouts/GridLayout';
// @ts-ignore: No implicit Any
import VideoTile from '../components/VideoTile';
// @ts-ignore: No implicit Any
import { VBPicker } from '../components/VirtualBackground/VBPicker';
import { Box, Flex } from '../../Layout';
import { config as cssConfig, CSS } from '../../Theme';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../components/AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useUISettings } from '../components/AppData/useUISettings';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { translateAcross } from '../../utils';
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS } from '../common/constants';

const Wrapper = ({ children, css = {} }: { children: React.ReactNode; css?: CSS }) => {
  if (!children) {
    return null;
  }
  return (
    <Box
      css={{
        w: '$100',
        h: '100%',
        p: '$10',
        flex: '1 1 0',
        background: '$surface_dim',
        r: '$1',
        position: 'relative',
        ...css,
        '@lg': {
          w: '100%',
          h: '100%',
          ml: 0,
          right: 0,
          position: 'fixed',
          bottom: 0,
          borderRadius: 0,
          zIndex: 10,
          ...(css['@lg'] || {}),
        },
        '@md': {
          p: '$6 $8',
          pb: '$12',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          animation: `${translateAcross({ yFrom: '100%' })} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
          ...(css['@md'] || {}),
        },
      }}
    >
      {children}
    </Box>
  );
};

const SidePane = ({
  tileProps,
  hideControls = false,
}: {
  tileProps?: TileCustomisationProps;
  hideControls?: boolean;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const trackId = useHMSStore(selectVideoTrackByPeerID(activeScreensharePeerId))?.id;
  const { elements } = useRoomLayoutConferencingScreen();
  const { elements: preview_elements } = useRoomLayoutPreviewScreen();
  const layoutMode = useUISettings(UI_SETTINGS.layoutMode);

  const backgroundMedia = preview_elements?.virtual_background?.background_media?.length
    ? preview_elements?.virtual_background?.background_media
    : elements?.virtual_background?.background_media || [];

  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    return () => {
      resetSidePane();
    };
  }, [resetSidePane]);

  const tileLayout = {
    hideParticipantNameOnTile: tileProps?.hide_participant_name_on_tile,
    roundedVideoTile: tileProps?.rounded_video_tile,
    hideAudioMuteOnTile: tileProps?.hide_audio_mute_on_tile,
    hideMetadataOnTile: tileProps?.hide_metadata_on_tile,
    objectFit: tileProps?.video_object_fit,
  };
  const mwebStreamingChat = isMobile && sidepane === SIDE_PANE_OPTIONS.CHAT && elements?.chat?.is_overlay;

  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        w: '$100',
        h: '100%',
        flexShrink: 0,
        gap: '$4',
        position: 'relative',
        '@md': { position: mwebStreamingChat ? 'absolute' : '', zIndex: 12 },
        '&:empty': { display: 'none' },
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

      {match(sidepane)
        .with(SIDE_PANE_OPTIONS.POLLS, () => (
          <Wrapper
            css={{
              '@md': {
                borderTopLeftRadius: '$2',
                borderTopRightRadius: '$2',
              },
            }}
          >
            <Polls />
          </Wrapper>
        ))
        .with(SIDE_PANE_OPTIONS.VB, () => (
          <Wrapper css={{ p: '$10 $6 $10 $10' }}>
            <VBPicker backgroundMedia={backgroundMedia} />
          </Wrapper>
        ))
        .with(SIDE_PANE_OPTIONS.CHAT, SIDE_PANE_OPTIONS.PARTICIPANTS, () => (
          <Wrapper
            css={{
              ...(mwebStreamingChat
                ? {
                    height: 'unset',
                    maxHeight: 300,
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 35.94%, rgba(0, 0, 0, 0.64) 100%)',
                    '@md': {
                      pb: '$20',
                    },
                  }
                : {}),
            }}
          >
            <SidePaneTabs hideControls={hideControls} active={sidepane} />
          </Wrapper>
        ))
        .with(SIDE_PANE_OPTIONS.ROOM_DETAILS, () => (
          <Wrapper>
            <RoomDetailsPane />
          </Wrapper>
        ))
        .otherwise(() => null)}
    </Flex>
  );
};

export default SidePane;
