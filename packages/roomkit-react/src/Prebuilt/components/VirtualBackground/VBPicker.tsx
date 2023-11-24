import React, { useEffect, useState } from 'react';
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
import { VirtualBackground, VirtualBackgroundMedia } from '@100mslive/types-prebuilt/elements/virtual_background';
import {
  HMSRoomState,
  selectIsLargeRoom,
  selectIsLocalVideoEnabled,
  selectIsLocalVideoPluginPresent,
  selectLocalPeer,
  selectRoomState,
  selectVideoTrackByID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { BlurPersonHighIcon, CloseIcon, CrossCircleIcon } from '@100mslive/react-icons';
import { Box, Flex, Video } from '../../../index';
import { Text } from '../../../Text';
import { VBCollection } from './VBCollection';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
// @ts-ignore
import { useUISettings } from '../AppData/useUISettings';
import { SIDE_PANE_OPTIONS, UI_SETTINGS } from '../../common/constants';
import { defaultMedia, VBEffectsPlugin } from './constants';

const iconDims = { height: '40px', width: '40px' };

export const VBPicker = ({ background_media = [] }: VirtualBackground = {}) => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const roomState = useHMSStore(selectRoomState);
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const isPluginAdded = useHMSStore(selectIsLocalVideoPluginPresent(VBEffectsPlugin.getName()));
  const [background, setBackground] = useState<string | HMSVirtualBackgroundTypes>(
    VBEffectsPlugin.getBackground() as string | HMSVirtualBackgroundTypes,
  );
  const mediaList = [
    ...background_media.filter(media => !!media.url).map((media: VirtualBackgroundMedia) => media.url || ''),
    ...defaultMedia,
  ];
  const inPreview = roomState === HMSRoomState.Preview;
  // Hidden in preview as the effect will be visible in the preview tile. Needed inside the room because the peer might not be on-screen
  const showVideoTile = isVideoOn && isLargeRoom && !inPreview;

  async function disableEffects() {
    // should we remove the plugin on no effects?
    if (isPluginAdded) {
      VBEffectsPlugin.removeEffects();
      setBackground(VBEffectsPlugin.getBackground() as string | HMSVirtualBackgroundTypes);
    }
  }

  function addPlugin({ mediaURL = '', blurPower = 0 }) {
    if (!localPeer?.videoTrack) {
      console.error('Video track is not available yet');
      return;
    }
    if (!isPluginAdded) {
      hmsActions.addPluginsToVideoStream([VBEffectsPlugin]);
    }
    if (mediaURL) {
      VBEffectsPlugin.setBackground(mediaURL);
    } else if (blurPower) {
      VBEffectsPlugin.setBlur(blurPower);
    }
    setBackground(VBEffectsPlugin.getBackground() as string);
  }

  useEffect(() => {
    if (!isVideoOn) {
      toggleVB();
    }
  }, [isVideoOn, toggleVB]);

  return (
    <Flex css={{ pr: '$6', size: '100%' }} direction="column">
      <Flex align="center" justify="between" css={{ w: '100%', background: '$surface_dim', pb: '$4' }}>
        <Text variant="h6" css={{ color: '$on_surface_high' }}>
          Virtual Background
        </Text>
        <Box
          css={{ color: '$on_surface_high', '&:hover': { color: '$on_surface_medium' }, cursor: 'pointer' }}
          onClick={toggleVB}
        >
          <CloseIcon />
        </Box>
      </Flex>

      {showVideoTile ? (
        <Video
          mirror={track?.facingMode !== 'environment' && mirrorLocalVideo}
          trackId={localPeer?.videoTrack}
          data-testid="preview_tile"
          css={{ width: '100%', height: '16rem' }}
        />
      ) : null}
      <Box
        css={{
          mt: '$4',
          overflowY: 'auto',
          flex: '1 1 0',
          mr: '-$10',
          pr: '$10',
        }}
      >
        <VBCollection
          title="Effects"
          options={[
            {
              title: 'No effect',
              icon: <CrossCircleIcon style={iconDims} />,
              value: HMSVirtualBackgroundTypes.NONE,
              onClick: async () => await disableEffects(),
            },
            {
              title: 'Blur',
              icon: <BlurPersonHighIcon style={iconDims} />,
              value: HMSVirtualBackgroundTypes.BLUR,
              onClick: async () => await addPlugin({ blurPower: 0.5 }),
            },
          ]}
          activeBackground={background}
        />

        <VBCollection
          title="Backgrounds"
          options={mediaList.map(mediaURL => ({
            mediaURL,
            value: mediaURL,
            onClick: async () => await addPlugin({ mediaURL }),
          }))}
          activeBackground={background}
        />
      </Box>
    </Flex>
  );
};
