import React, { useEffect, useRef, useState } from 'react';
import { HMSEffectsPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
import { VirtualBackground, VirtualBackgroundMedia } from '@100mslive/types-prebuilt/elements/virtual_background';
import {
  HMSRoomState,
  selectIsLargeRoom,
  selectIsLocalVideoEnabled,
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
import { defaultMedia } from './constants';

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
  const pluginRef = useRef<null | HMSEffectsPlugin>(null);
  const [background, setBackground] = useState<string | HMSVirtualBackgroundTypes>(HMSVirtualBackgroundTypes.NONE);
  const mediaList = background_media?.length
    ? background_media.filter(media => !!media.url).map((media: VirtualBackgroundMedia) => media.url || '')
    : defaultMedia;

  // Hidden in preview as the effect will be visible in the preview tile. Needed inside the room because the peer might not be on-screen
  const showVideoTile = isVideoOn && isLargeRoom && roomState !== HMSRoomState.Preview;

  async function disableEffects() {
    // should we remove the plugin on no effects?
    if (pluginRef.current) {
      await hmsActions.removePluginFromVideoStream(pluginRef.current);
      pluginRef.current = null;
      setBackground(HMSVirtualBackgroundTypes.NONE);
    }
  }

  function addPlugin({ mediaURL = '', blurPower = 0 }) {
    if (!localPeer?.videoTrack) {
      console.error('Video track is not available yet');
      return;
    }
    if (!pluginRef.current) {
      pluginRef.current = new HMSEffectsPlugin();
      hmsActions.addPluginToVideoStream(pluginRef.current);
    }
    const vbPlugin = pluginRef.current;
    if (mediaURL) {
      vbPlugin.setBackground(mediaURL);
    } else if (blurPower) {
      vbPlugin.setBlur(blurPower);
    }
    setBackground(vbPlugin.getBackground() as string);
  }

  useEffect(() => {
    if (!isVideoOn) {
      toggleVB();
    }
  }, [isVideoOn, toggleVB]);

  return (
    <Box css={{ maxHeight: '100%', overflowY: 'auto', pr: '$6' }}>
      <Flex align="center" justify="between" css={{ w: '100%', position: 'sticky', top: 0 }}>
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
          css={{ width: '100%', height: '16rem', position: 'sticky', top: '$17' }}
        />
      ) : null}

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
  );
};
