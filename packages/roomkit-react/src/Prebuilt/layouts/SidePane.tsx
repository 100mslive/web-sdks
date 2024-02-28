import React, { useEffect } from 'react';
import { useMedia } from 'react-use';
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
import { config as cssConfig } from '../../Theme';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../components/AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useUISettings } from '../components/AppData/useUISettings';
import {
  useRoomLayoutConferencingScreen,
  useRoomLayoutPreviewScreen,
} from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsLandscape, useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
import { translateAcross } from '../../utils';
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS } from '../common/constants';

const SidePane = ({
  tileProps,
  hideControls = false,
}: {
  tileProps?: TileCustomisationProps;
  hideControls?: boolean;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const isLandscape = useIsLandscape();
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

  const resetSidePane = useSidepaneReset();
  let ViewComponent;
  if (sidepane === SIDE_PANE_OPTIONS.POLLS) {
    ViewComponent = <Polls />;
  }
  if (sidepane === SIDE_PANE_OPTIONS.PARTICIPANTS || sidepane === SIDE_PANE_OPTIONS.CHAT) {
    ViewComponent = (
      <SidePaneTabs hideControls={hideControls} active={sidepane} hideTab={isMobileHLSStream || isLandscapeHLSStream} />
    );
  }
  if (sidepane === SIDE_PANE_OPTIONS.VB) {
    ViewComponent = <VBPicker backgroundMedia={backgroundMedia} />;
  }
  if (sidepane === SIDE_PANE_OPTIONS.ROOM_DETAILS) {
    ViewComponent = <RoomDetailsPane />;
  }

  useEffect(() => {
    return () => {
      resetSidePane();
    };
  }, [resetSidePane]);

  if (!ViewComponent && (!trackId || layoutMode !== LayoutMode.GALLERY)) {
    return null;
  }
  const tileLayout = {
    hideParticipantNameOnTile: tileProps?.hide_participant_name_on_tile,
    roundedVideoTile: tileProps?.rounded_video_tile,
    hideAudioMuteOnTile: tileProps?.hide_audio_mute_on_tile,
    hideMetadataOnTile: tileProps?.hide_metadata_on_tile,
    objectFit: tileProps?.video_object_fit,
  };
  const VB = sidepane === SIDE_PANE_OPTIONS.VB;
  const mwebStreamingChat = isMobile && sidepane === SIDE_PANE_OPTIONS.CHAT && elements?.chat?.is_overlay;

  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        w: '$100',
        h: isMobileHLSStream ? '64%' : '100%',
        flexShrink: 0,
        gap: '$4',
        position: 'relative',
        '@md': { position: mwebStreamingChat || isLandscape ? 'absolute' : '', zIndex: 12 },
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
      {!!ViewComponent && (
        <Box
          css={{
            w: '$100',
            h: mwebStreamingChat || isLandscape ? '0' : '100%',
            p: VB ? '$10 $6 $10 $10' : '$10',
            flex: '1 1 0',
            minHeight: 0,
            maxHeight: mwebStreamingChat || isLandscape ? '300px' : 'unset',
            background:
              mwebStreamingChat || isLandscape
                ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 35.94%, rgba(0, 0, 0, 0.64) 100%)'
                : '$surface_dim',
            r: '$1',
            position: 'relative',
            '@lg': {
              w: '100%',
              h: '100%',
              ml: 0,
              right: 0,
              position: isLandscapeHLSStream ? '' : 'fixed',
              minHeight: isLandscapeHLSStream ? '100%' : '',
              bottom: 0,
              borderRadius: 0,
              zIndex: 10,
            },
            '@md': {
              p: '$6 $8',
              h: isMobileHLSStream ? '64%' : '100%',
              pb: '$12',
              minHeight: isMobileHLSStream ? '64%' : '',
              borderTopLeftRadius: sidepane === SIDE_PANE_OPTIONS.POLLS ? '$2' : '0',
              borderTopRightRadius: sidepane === SIDE_PANE_OPTIONS.POLLS ? '$2' : '0',
              animation: `${translateAcross({ yFrom: '100%' })} 150ms cubic-bezier(0.22, 1, 0.36, 1)`,
            },
          }}
        >
          {ViewComponent}
        </Box>
      )}
    </Flex>
  );
};

export default SidePane;
