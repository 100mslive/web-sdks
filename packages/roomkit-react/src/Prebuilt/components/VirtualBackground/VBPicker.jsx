import React, { useEffect, useRef, useState } from 'react';
import { HMSVBPlugin } from '@100mslive/hms-virtual-background';
import {
  HMSRoomState,
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
import { useSetAppDataByKey, useUISettings } from '../AppData/useUISettings';
// @ts-ignore
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS } from '../../common/constants';
import { defaultMedia, VB_EFFECT } from './constants';

const iconDims = { height: '40px', width: '40px' };

export const VBPicker = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const pluginRef = useRef(window.vbPluginRef);
  const hmsActions = useHMSActions();
  const role = useHMSStore(selectLocalPeerRole);
  const [isVBSupported, setIsVBSupported] = useState(false);
  const localPeerVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const [background, setBackground] = useSetAppDataByKey(APP_DATA.background);
  const [backgroundType, setBackgroundType] = useSetAppDataByKey(APP_DATA.backgroundType);
  const localPeer = useHMSStore(selectLocalPeer);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const roomState = useHMSStore(selectRoomState);

  // Hidden in preview as the effect will be visible in the preview tile. Needed inside the room because the peer might not be on-screen
  const showVideoTile = isVideoOn && roomState !== HMSRoomState.Preview;

  async function createPlugin() {
    if (!pluginRef.current) {
      pluginRef.current = new HMSVBPlugin(background, backgroundType);
    }
  }

  useEffect(() => {
    if (!localPeerVideoTrackID) {
      return;
    }
    createPlugin().then(() => {
      //check support of plugin
      if (pluginRef.current) {
        const pluginSupport = hmsActions.validateVideoPluginSupport(pluginRef.current);
        setIsVBSupported(pluginSupport.isSupported);
      }
    });
  }, [hmsActions, localPeerVideoTrackID]);

  useEffect(() => {
    return () => {
      window.vbPluginRef = pluginRef.current;
    };
  }, []);

  async function addPlugin({ mediaURL = '', blurPower = 0 }) {
    try {
      await createPlugin();
      window.HMS.virtualBackground = pluginRef.current;
      if (mediaURL) {
        const img = document.createElement('img');
        img.alt = 'VB';
        img.src = mediaURL;
        await pluginRef.current.setBackground(img, VB_EFFECT.MEDIA);
      } else if (blurPower) {
        await pluginRef.current.setBackground(VB_EFFECT.BLUR, VB_EFFECT.BLUR);
      }
      setBackground(mediaURL || VB_EFFECT.BLUR);
      setBackgroundType(mediaURL ? VB_EFFECT.MEDIA : VB_EFFECT.BLUR);
      if (role)
        await hmsActions.addPluginToVideoTrack(pluginRef.current, Math.floor(role.publishParams.video.frameRate / 2));
    } catch (err) {
      console.error('add virtual background plugin failed', err);
      setBackground(VB_EFFECT.NONE);
      setBackgroundType(VB_EFFECT.NONE);
    }
  }

  async function disableEffects() {
    if (pluginRef.current) {
      setBackground(VB_EFFECT.NONE);
      setBackgroundType(VB_EFFECT.NONE);
      pluginRef.current.setBackground(VB_EFFECT.NONE, VB_EFFECT.NONE);
    }
  }

  if (!isVBSupported) {
    return null;
  }

  return (
    <Box css={{ maxHeight: '100%', overflowY: 'auto', pr: '$6' }}>
      <Flex align="center" justify="between" css={{ w: '100%', pb: '$10' }}>
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
        activeBackgroundType={pluginRef.current?.backgroundType || VB_EFFECT.NONE}
        activeBackground={pluginRef.current?.background?.src || pluginRef.current?.background || VB_EFFECT.NONE}
      />

      <VBCollection
        title="Backgrounds"
        options={defaultMedia.map(mediaURL => ({
          type: VB_EFFECT.MEDIA,
          mediaURL,
          onClick: async () => await addPlugin({ mediaURL }),
        }))}
        activeBackgroundType={pluginRef.current?.backgroundType || VB_EFFECT.NONE}
        activeBackground={pluginRef.current?.background?.src || pluginRef.current?.background || VB_EFFECT.NONE}
      />
    </Box>
  );
};
