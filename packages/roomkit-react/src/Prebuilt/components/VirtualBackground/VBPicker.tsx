import React, { useEffect, useRef, useState } from 'react';
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
import { VirtualBackground, VirtualBackgroundMedia } from '@100mslive/types-prebuilt/elements/virtual_background';
import {
  HMSRoomState,
  selectIsLargeRoom,
  selectIsLocalVideoEnabled,
  selectLocalPeer,
  selectLocalPeerRole,
  selectLocalVideoTrackID,
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
// @ts-ignore
import { SIDE_PANE_OPTIONS, UI_SETTINGS } from '../../common/constants';
import { defaultMedia, vbPlugin } from './constants';

const iconDims = { height: '40px', width: '40px' };
const MAX_RETRIES = 2;

export const VBPicker = ({ background_media = [] }: VirtualBackground = {}) => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const hmsActions = useHMSActions();
  const role = useHMSStore(selectLocalPeerRole);
  const [isVBSupported, setIsVBSupported] = useState(false);
  const localPeerVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const localPeer = useHMSStore(selectLocalPeer);
  // @ts-ignore
  const [background, setBackground] = useState(vbPlugin.background);
  // @ts-ignore
  const [backgroundType, setBackgroundType] = useState(vbPlugin.backgroundType);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const roomState = useHMSStore(selectRoomState);
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const addedPluginToVideoTrack = useRef(false);
  const mediaList = background_media?.length
    ? background_media.map((media: VirtualBackgroundMedia) => media?.url)
    : defaultMedia;

  // Hidden in preview as the effect will be visible in the preview tile. Needed inside the room because the peer might not be on-screen
  const showVideoTile = isVideoOn && isLargeRoom && roomState !== HMSRoomState.Preview;

  const clearVBState = () => {
    setBackground(HMSVirtualBackgroundTypes.NONE);
    setBackgroundType(HMSVirtualBackgroundTypes.NONE);
  };

  useEffect(() => {
    if (!localPeerVideoTrackID) {
      return;
    }

    //check support of plugin
    if (vbPlugin) {
      const pluginSupport = hmsActions.validateVideoPluginSupport(vbPlugin);
      setIsVBSupported(pluginSupport.isSupported);
    }
  }, [hmsActions, localPeerVideoTrackID]);

  async function disableEffects() {
    if (vbPlugin) {
      vbPlugin.setBackground(HMSVirtualBackgroundTypes.NONE, HMSVirtualBackgroundTypes.NONE);
      clearVBState();
    }
  }

  async function addPlugin({ mediaURL = '', blurPower = 0 }) {
    let retries = 0;
    try {
      if (mediaURL) {
        const img = document.createElement('img');
        img.alt = 'VB';
        img.src = mediaURL;
        try {
          await vbPlugin.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
        } catch (e) {
          console.error(e);
          if (retries++ < MAX_RETRIES) {
            await vbPlugin.setBackground(img, HMSVirtualBackgroundTypes.IMAGE);
          }
        }
      } else if (blurPower) {
        await vbPlugin.setBackground(HMSVirtualBackgroundTypes.BLUR, HMSVirtualBackgroundTypes.BLUR);
      }
      setBackground(mediaURL || HMSVirtualBackgroundTypes.BLUR);
      setBackgroundType(mediaURL ? HMSVirtualBackgroundTypes.IMAGE : HMSVirtualBackgroundTypes.BLUR);
      if (role && !addedPluginToVideoTrack.current) {
        await hmsActions.addPluginToVideoTrack(vbPlugin, Math.floor(role.publishParams.video.frameRate / 2));
        addedPluginToVideoTrack.current = true;
      }
    } catch (err) {
      console.error('Failed to apply VB', err);
      disableEffects();
    }
  }

  useEffect(() => {
    if (!isVideoOn) {
      toggleVB();
    }
  }, [isVideoOn, toggleVB]);

  if (!isVBSupported) {
    return null;
  }

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
            type: HMSVirtualBackgroundTypes.NONE,
            onClick: async () => await disableEffects(),
          },
          {
            title: 'Blur',
            icon: <BlurPersonHighIcon style={iconDims} />,
            type: HMSVirtualBackgroundTypes.BLUR,
            onClick: async () => await addPlugin({ blurPower: 0.5 }),
          },
        ]}
        activeBackgroundType={backgroundType || HMSVirtualBackgroundTypes.NONE}
        // @ts-ignore
        activeBackground={vbPlugin.background?.src || vbPlugin.background || HMSVirtualBackgroundTypes.NONE}
      />

      <VBCollection
        title="Backgrounds"
        options={mediaList.map(mediaURL => ({
          type: HMSVirtualBackgroundTypes.IMAGE,
          mediaURL,
          onClick: async () => await addPlugin({ mediaURL }),
        }))}
        activeBackgroundType={backgroundType || HMSVirtualBackgroundTypes.NONE}
        activeBackground={background?.src || background || HMSVirtualBackgroundTypes.NONE}
      />
    </Box>
  );
};
