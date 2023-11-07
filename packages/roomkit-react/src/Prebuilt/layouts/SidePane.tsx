import React, { useEffect } from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { selectAppData, selectVideoTrackByPeerID, useHMSStore } from '@100mslive/react-sdk';
import { Polls } from '../components/Polls/Polls';
import { SidePaneTabs } from '../components/SidePaneTabs';
import { TileCustomisationProps } from '../components/VideoLayouts/GridLayout';
// @ts-ignore: No implicit Any
import VideoTile from '../components/VideoTile';
// @ts-ignore: No implicit Any
import { VBPicker } from '../components/VirtualBackground/VBPicker';
import { Box, Flex } from '../../Layout';
import { CSS } from '../../Theme';
import { ComponentWithState, RenderComponentByState } from '../RenderComponentByState';
// @ts-ignore: No implicit Any
import { useSidepaneReset } from '../components/AppData/useSidepane';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { translateAcross } from '../../utils';
// @ts-ignore: No implicit Any
import { APP_DATA, SIDE_PANE_OPTIONS } from '../common/constants';

const Wrapper = ({ css = {}, children }: { css?: CSS; children: React.ReactNode }) => {
  return (
    <Box
      css={{
        w: '$100',
        h: '100%',
        p: '$10',
        flex: '1 1 0',
        minHeight: 0,
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
  screenType,
  tileProps,
  hideControls = false,
}: {
  screenType: keyof ConferencingScreen;
  tileProps?: TileCustomisationProps;
  hideControls?: boolean;
}) => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const activeScreensharePeerId = useHMSStore(selectAppData(APP_DATA.activeScreensharePeerId));
  const trackId = useHMSStore(selectVideoTrackByPeerID(activeScreensharePeerId))?.id;
  const { elements } = useRoomLayoutConferencingScreen();
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
  const isOverlayChat = !!elements?.chat?.is_overlay;

  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        w: '$100',
        h: '100%',
        flexShrink: 0,
        gap: '$4',
        '@md': {
          position: sidepane === SIDE_PANE_OPTIONS.CHAT && isOverlayChat ? 'absolute' : '',
          zIndex: 12,
        },
        '&:empty': {
          display: 'none',
        },
      }}
    >
      {trackId && (
        <VideoTile
          peerId={activeScreensharePeerId}
          trackId={trackId}
          width="100%"
          height={225}
          rootCSS={{ p: 0, alignSelf: 'start', flexShrink: 0 }}
          {...tileLayout}
        />
      )}

      <RenderComponentByState>
        <ComponentWithState state={sidepane === SIDE_PANE_OPTIONS.POLLS}>
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
        </ComponentWithState>
        <ComponentWithState state={sidepane === SIDE_PANE_OPTIONS.CHAT}>
          <Wrapper
            css={
              isOverlayChat
                ? {
                    '@md': {
                      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 35.94%, rgba(0, 0, 0, 0.64) 100%)',
                      pb: '$20',
                      maxHeight: 300,
                    },
                  }
                : undefined
            }
          >
            <SidePaneTabs screenType={screenType} hideControls={hideControls} active={sidepane} />
          </Wrapper>
        </ComponentWithState>
        <ComponentWithState state={sidepane === SIDE_PANE_OPTIONS.PARTICIPANTS}>
          <Wrapper>
            <SidePaneTabs screenType={screenType} hideControls={hideControls} active={sidepane} />
          </Wrapper>
        </ComponentWithState>
        <ComponentWithState state={sidepane === SIDE_PANE_OPTIONS.VB}>
          <Wrapper css={{ p: '$10 $6 $10 $10' }}>
            <VBPicker />
          </Wrapper>
        </ComponentWithState>
      </RenderComponentByState>
    </Flex>
  );
};

export default SidePane;
