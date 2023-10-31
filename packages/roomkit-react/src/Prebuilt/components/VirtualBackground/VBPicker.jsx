import React, { useEffect, useRef, useState } from 'react';
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
import { useSetAppDataByKey, useUISettings } from '../AppData/useUISettings';
// @ts-ignore
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS, VB_EFFECT } from '../../common/constants';

const iconDims = { height: '40px', width: '40px' };

export const VBPicker = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const pluginRef = useRef(null);
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

  async function createPlugin() {
    if (!pluginRef.current) {
      const { HMSVBPlugin } = await import('@100mslive/hms-virtual-background');
      pluginRef.current = new HMSVBPlugin(background, backgroundType);
    }
  }

  useEffect(() => {
    if (!localPeerVideoTrackID) {
      return;
    }
    createPlugin().then(() => {
      //check support of plugin
      const pluginSupport = hmsActions.validateVideoPluginSupport(pluginRef.current);
      setIsVBSupported(pluginSupport.isSupported);
    });
  }, [hmsActions, localPeerVideoTrackID]);

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
      // Will store blur power here
      setBackground(mediaURL || VB_EFFECT.BLUR);
      setBackgroundType(mediaURL ? VB_EFFECT.MEDIA : VB_EFFECT.BLUR);

      await hmsActions.addPluginToVideoTrack(pluginRef.current, Math.floor(role.publishParams.video.frameRate / 2));
    } catch (err) {
      console.error('add virtual background plugin failed', err);
    }
  }

  async function removePlugin() {
    if (pluginRef.current) {
      await hmsActions.removePluginFromVideoTrack(pluginRef.current);
      pluginRef.current = null;
    }
  }

  if (!isVBSupported) {
    return null;
  }

  const VBCollections = [
    {
      title: 'Effects',
      options: [
        {
          title: 'No effect',
          icon: <CrossCircleIcon style={iconDims} />,
          type: VB_EFFECT.NONE,
          onClick: async () => await removePlugin(),
          isActive: true,
        },
        {
          title: 'Blur',
          icon: <BlurPersonHighIcon style={iconDims} />,
          type: VB_EFFECT.BLUR,
          onClick: async () => await addPlugin({ blurPower: 0.5 }),
        },
        // {
        //   title: 'Touch-up',
        //   icon: <SparkleIcon style={iconDims} />,
        //   type: VB_EFFECT.BEAUTIFY,
        //   onClick: () => console.log('Touch-up'),
        // },
      ],
    },
    {
      title: 'Backgrounds',
      // TODO Refactor onClicks here
      options: [
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-1.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-2.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-3.png',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-4.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-5.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-6.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-7.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-8.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-9.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-10.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-11.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-12.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-13.jpg',
        'https://d2qi07yyjujoxr.cloudfront.net/webapp/vb/vb-14.jpg',
      ].map(mediaURL => ({
        type: VB_EFFECT.MEDIA,
        mediaURL,
        onClick: async () => await addPlugin({ mediaURL }),
      })),
    },
  ];

  return (
    <Box css={{ maxHeight: '100%', overflowY: 'auto' }}>
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

      {isVideoOn && roomState !== HMSRoomState.Preview ? (
        <Video
          mirror={track?.facingMode !== 'environment' && mirrorLocalVideo}
          trackId={localPeer.videoTrack}
          data-testid="preview_tile"
          css={{ width: '100%', height: '16rem' }}
        />
      ) : null}

      {VBCollections.map(collection => (
        <VBCollection
          key={collection.title}
          {...collection}
          activeBackgroundType={pluginRef.current?.backgroundType || VB_EFFECT.NONE}
          activeBackground={pluginRef.current?.background?.src || pluginRef.current?.background || VB_EFFECT.NONE}
        />
      ))}
    </Box>
  );
};