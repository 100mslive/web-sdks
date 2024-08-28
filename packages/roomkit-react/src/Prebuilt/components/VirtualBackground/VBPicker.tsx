import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { selectAppData, selectLocalPeerRole } from '@100mslive/hms-video-store';
// eslint-disable-next-line
import { HMSVBPlugin, HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background/hmsvbplugin';
import { VirtualBackgroundMedia } from '@100mslive/types-prebuilt/elements/virtual_background';
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
import { BlurPersonHighIcon, CrossCircleIcon, CrossIcon } from '@100mslive/react-icons';
import { Box, config as cssConfig, Flex, Loading, Slider, Video } from '../../../index';
import { Text } from '../../../Text';
import { doesBrowserSupportEffectsSDK } from './util';
import { VBCollection } from './VBCollection';
import { VBHandler } from './VBHandler';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
import { useSidepaneResetOnLayoutUpdate } from '../AppData/useSidepaneResetOnLayoutUpdate';
// @ts-ignore
import { useSetAppDataByKey, useUISettings } from '../AppData/useUISettings';
import { APP_DATA, SIDE_PANE_OPTIONS, UI_SETTINGS } from '../../common/constants';

const iconDims = { height: '40px', width: '40px' };

export const VBPicker = ({ backgroundMedia = [] }: { backgroundMedia: VirtualBackgroundMedia[] }) => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const role = useHMSStore(selectLocalPeerRole);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(localPeer?.videoTrack);
  const track = useHMSStore(trackSelector);
  const [blurAmount, setBlurAmount] = useState(VBHandler.getBlurAmount() || 0.5);
  const roomState = useHMSStore(selectRoomState);
  const isLargeRoom = useHMSStore(selectIsLargeRoom);
  const [isBlurSupported, setIsBlurSupported] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);
  const [loadingEffects, setLoadingEffects] = useSetAppDataByKey(APP_DATA.loadingEffects);
  const isPluginAdded = useHMSStore(selectIsLocalVideoPluginPresent(VBHandler?.getName() || ''));
  const background = useHMSStore(selectAppData(APP_DATA.background));
  const mediaList = backgroundMedia.map((media: VirtualBackgroundMedia) => media.url || '');

  const inPreview = roomState === HMSRoomState.Preview;
  // Hidden in preview as the effect will be visible in the preview tile
  const showVideoTile = isVideoOn && isLargeRoom && !inPreview;

  useEffect(() => {
    if (!track?.id) {
      return;
    }
    const isEffectsSupported = doesBrowserSupportEffectsSDK();
    setIsBlurSupported(isEffectsSupported);
    const vbObject = VBHandler.getVBObject();
    if (!isPluginAdded && !vbObject) {
      setLoadingEffects(true);
      let vbObject = VBHandler.getVBObject();
      if (!vbObject) {
        VBHandler.initialisePlugin('', () => setLoadingEffects(false));
        vbObject = VBHandler.getVBObject();
        setLoadingEffects(false);
        if (!role) {
          return;
        }
        hmsActions.addPluginToVideoTrack(vbObject as HMSVBPlugin, Math.floor(role.publishParams.video.frameRate / 2));
      }
      const handleDefaultBackground = async () => {
        switch (background) {
          case HMSVirtualBackgroundTypes.NONE: {
            break;
          }
          case HMSVirtualBackgroundTypes.BLUR: {
            await VBHandler.setBlur(blurAmount);
            break;
          }
          default:
            await VBHandler.setBackground(background);
        }
      };
      handleDefaultBackground();
    }
  }, [hmsActions, role, isPluginAdded, track?.id, background, blurAmount, setLoadingEffects]);

  useEffect(() => {
    if (!isVideoOn) {
      toggleVB();
    }
    return () => setLoadingEffects(false);
  }, [isVideoOn, setLoadingEffects, toggleVB]);

  useSidepaneResetOnLayoutUpdate('virtual_background', SIDE_PANE_OPTIONS.VB);

  return (
    <Flex css={{ pr: '$6', size: '100%' }} direction="column">
      <Flex align="center" justify="between" css={{ w: '100%', background: '$surface_dim', pb: '$4' }}>
        <Text variant="h6" css={{ color: '$on_surface_high', display: 'flex', alignItems: 'center' }}>
          Virtual Background {isMobile && loadingEffects ? <Loading size={18} style={{ marginLeft: '0.5rem' }} /> : ''}
        </Text>
        <Box
          css={{ color: '$on_surface_high', '&:hover': { color: '$on_surface_medium' }, cursor: 'pointer' }}
          onClick={toggleVB}
        >
          <CrossIcon />
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
              onClick: async () => {
                await VBHandler.removeEffects();
                hmsActions.setAppData(APP_DATA.background, HMSVirtualBackgroundTypes.NONE);
              },
              supported: true,
            },
            {
              title: 'Blur',
              icon: <BlurPersonHighIcon style={iconDims} />,
              value: HMSVirtualBackgroundTypes.BLUR,
              onClick: async () => {
                await VBHandler?.setBlur(blurAmount);
                hmsActions.setAppData(APP_DATA.background, HMSVirtualBackgroundTypes.BLUR);
              },
              supported: isBlurSupported,
            },
          ]}
          activeBackground={background}
        />

        {/* Slider */}
        <Flex direction="column" css={{ w: '100%', gap: '$8', mt: '$8' }}>
          {background === HMSVirtualBackgroundTypes.BLUR ? (
            <Box>
              <Text variant="sm" css={{ color: '$on_surface_high', fontWeight: '$semiBold', mb: '$4' }}>
                Blur intensity
              </Text>
              <Flex css={{ w: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '$4' }}>
                <Text variant="caption" css={{ fontWeight: '$medium', color: '$on_surface_medium' }}>
                  Low
                </Text>
                <Slider
                  showTooltip={false}
                  value={[blurAmount]}
                  onValueChange={async e => {
                    setBlurAmount(e[0]);
                    await VBHandler.setBlur(e[0]);
                  }}
                  step={0.1}
                  min={0.1}
                  max={1}
                />
                <Text variant="caption" css={{ fontWeight: '$medium', color: '$on_surface_medium' }}>
                  High
                </Text>
              </Flex>
            </Box>
          ) : null}
        </Flex>

        <VBCollection
          title="Backgrounds"
          options={mediaList.map(mediaURL => ({
            mediaURL,
            value: mediaURL,
            onClick: async () => {
              await VBHandler?.setBackground(mediaURL);
              hmsActions.setAppData(APP_DATA.background, mediaURL);
            },
            supported: true,
          }))}
          activeBackground={background}
        />
      </Box>
    </Flex>
  );
};
