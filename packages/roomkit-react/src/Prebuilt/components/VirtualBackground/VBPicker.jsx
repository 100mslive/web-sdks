import React, { useEffect, useState } from 'react';
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
import { useSidepaneToggle } from '../AppData/useSidepane';
import { useUISettings } from '../AppData/useUISettings';
import { SIDE_PANE_OPTIONS, UI_SETTINGS } from '../../common/constants';
import { defaultMedia, VB_EFFECT, vbPlugin } from './constants';

const iconDims = { height: '40px', width: '40px' };

export const VBPicker = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const hmsActions = useHMSActions();
  const role = useHMSStore(selectLocalPeerRole);
  const [isVBSupported, setIsVBSupported] = useState(false);
  const localPeerVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const localPeer = useHMSStore(selectLocalPeer);
  const [background, setBackground] = useState(vbPlugin.background);
  const [backgroundType, setBackgroundType] = useState(vbPlugin.backgroundType);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const roomState = useHMSStore(selectRoomState);
  const isLargeRoom = useHMSStore(selectIsLargeRoom);

  // Hidden in preview as the effect will be visible in the preview tile. Needed inside the room because the peer might not be on-screen
  const showVideoTile = isVideoOn && isLargeRoom && roomState !== HMSRoomState.Preview;

  const clearVBState = () => {
    setBackground(VB_EFFECT.NONE);
    setBackgroundType(VB_EFFECT.NONE);
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
      vbPlugin.setBackground(VB_EFFECT.NONE, VB_EFFECT.NONE);
      clearVBState();
    }
  }

  async function addPlugin({ mediaURL = '', blurPower = 0 }) {
    try {
      if (mediaURL) {
        const img = document.createElement('img');
        img.alt = 'VB';
        img.src = mediaURL;
        await vbPlugin.setBackground(img, VB_EFFECT.MEDIA);
      } else if (blurPower) {
        await vbPlugin.setBackground(VB_EFFECT.BLUR, VB_EFFECT.BLUR);
      }
      setBackground(mediaURL || VB_EFFECT.BLUR);
      setBackgroundType(mediaURL ? VB_EFFECT.MEDIA : VB_EFFECT.BLUR);
      if (role) await hmsActions.addPluginToVideoTrack(vbPlugin, Math.floor(role.publishParams.video.frameRate / 2));
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
            type: VB_EFFECT.NONE,
            onClick: async () => await disableEffects(),
          },
          {
            title: 'Blur',
            icon: <BlurPersonHighIcon style={iconDims} />,
            type: VB_EFFECT.BLUR,
            onClick: async () => await addPlugin({ blurPower: 0.5 }),
          },
        ]}
        activeBackgroundType={backgroundType || VB_EFFECT.NONE}
        activeBackground={vbPlugin.background?.src || vbPlugin.background || VB_EFFECT.NONE}
      />

      <VBCollection
        title="Backgrounds"
        options={defaultMedia.map(mediaURL => ({
          type: VB_EFFECT.MEDIA,
          mediaURL,
          onClick: async () => await addPlugin({ mediaURL }),
        }))}
        activeBackgroundType={backgroundType || VB_EFFECT.NONE}
        activeBackground={background?.src || background || VB_EFFECT.NONE}
      />
    </Box>
  );
};
