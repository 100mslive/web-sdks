import React, { Fragment, useRef, useState } from 'react';
import {
  DeviceType,
  selectIsLocalVideoEnabled,
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useDevices,
  useHMSStore,
} from '@100mslive/react-sdk';
import { MicOnIcon, SpeakerIcon, VideoOnIcon } from '@100mslive/react-icons';
import { Box, Button, Dropdown, Flex, StyledVideoTile, Text, Video } from '../../../';
import { DialogDropdownTrigger } from '../../primitives/DropdownTrigger';
import { useUISettings } from '../AppData/useUISettings';
import { useAudioOutputTest } from '../hooks/useAudioOutputTest';
import { useDropdownSelection } from '../hooks/useDropdownSelection';
import { settingOverflow } from './common';
import { TEST_AUDIO_URL, UI_SETTINGS } from '../../common/constants';

/**
 * wrap the button on click of whom settings should open, this component will take care of the rest,
 * it'll give the user options to change input/output device as well as check speaker.
 * There is also another controlled way of using this by passing in open and onOpenChange.
 */
const Settings = ({ setHide }) => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput, audioOutput } = allDevices;
  const videoTrackId = useHMSStore(selectLocalVideoTrackID);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  // don't show speaker selector where the API is not supported, and use
  // a generic word("Audio") for Mic. In some cases(Chrome Android for example) this changes both mic and speaker keeping them in sync.
  const shouldShowAudioOutput = 'setSinkId' in HTMLMediaElement.prototype;
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const trackSelector = selectVideoTrackByID(videoTrackId);
  const track = useHMSStore(trackSelector);

  /**
   * Chromium browsers return an audioOutput with empty label when no permissions are given
   */
  const audioOutputFiltered = audioOutput?.filter(item => !!item.label) ?? [];

  if (!videoInput?.length && !audioInput?.length && !audioOutputFiltered?.length) {
    setHide(true);
  }

  return (
    <Box className={settingOverflow()}>
      {videoInput?.length ? (
        <Fragment>
          {isVideoOn && (
            <StyledVideoTile.Container
              css={{
                w: '90%',
                px: '$10',
                height: '$48',
                bg: 'transparent',
                m: '$10 auto',
              }}
            >
              <Video trackId={videoTrackId} mirror={track?.facingMode !== 'environment' && mirrorLocalVideo} />
            </StyledVideoTile.Container>
          )}
          <DeviceSelector
            title="Video"
            devices={videoInput}
            icon={<VideoOnIcon />}
            selection={selectedDeviceIDs.videoInput}
            onChange={deviceId =>
              updateDevice({
                deviceId,
                deviceType: DeviceType.videoInput,
              })
            }
          />
        </Fragment>
      ) : null}

      {audioInput?.length ? (
        <DeviceSelector
          title={shouldShowAudioOutput ? 'Microphone' : 'Audio'}
          icon={<MicOnIcon />}
          devices={audioInput}
          selection={selectedDeviceIDs.audioInput}
          onChange={deviceId =>
            updateDevice({
              deviceId,
              deviceType: DeviceType.audioInput,
            })
          }
        />
      ) : null}

      {audioOutputFiltered?.length && shouldShowAudioOutput ? (
        <DeviceSelector
          title="Speaker"
          icon={<SpeakerIcon />}
          devices={audioOutput}
          selection={selectedDeviceIDs.audioOutput}
          onChange={deviceId =>
            updateDevice({
              deviceId,
              deviceType: DeviceType.audioOutput,
            })
          }
        >
          <TestAudio id={selectedDeviceIDs.audioOutput} />
        </DeviceSelector>
      ) : null}
    </Box>
  );
};

const DeviceSelector = ({ title, devices, selection, onChange, icon, children = null }) => {
  const [open, setOpen] = useState(false);
  const selectionBg = useDropdownSelection();
  const ref = useRef(null);

  return (
    <Box css={{ mb: '$10' }}>
      <Text css={{ mb: '$4' }}>{title}</Text>
      <Flex
        align="center"
        css={{
          gap: '$4',
          containerMd: {
            flexDirection: children ? 'column' : 'row',
            alignItems: children ? 'start' : 'center',
          },
        }}
      >
        <Box
          css={{
            position: 'relative',
            flex: '1 1 0',
            minWidth: 0,
            w: '100%',
            maxWidth: '100%',
            containerMd: {
              mb: children ? '$8' : 0,
            },
          }}
        >
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <DialogDropdownTrigger
              ref={ref}
              icon={icon}
              title={devices.find(({ deviceId }) => deviceId === selection)?.label || 'Select device from list'}
              open={open}
            />
            <Dropdown.Portal>
              <Dropdown.Content align="start" sideOffset={8} css={{ w: ref.current?.clientWidth, zIndex: 1001 }}>
                {devices.map(device => {
                  return (
                    <Dropdown.Item
                      key={device.label}
                      onSelect={() => onChange(device.deviceId)}
                      css={{
                        px: '$9',
                        bg: device.deviceId === selection ? selectionBg : undefined,
                      }}
                    >
                      {device.label}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </Box>
        {children}
      </Flex>
    </Box>
  );
};

const TestAudio = ({ id }) => {
  const { playing, setPlaying, audioRef } = useAudioOutputTest({ deviceId: id });
  return (
    <>
      <Button
        variant="standard"
        css={{
          flexShrink: 0,
          p: '$6 $9',
          containerMd: {
            w: '100%',
          },
        }}
        onClick={() => audioRef.current?.play()}
        disabled={playing}
      >
        <SpeakerIcon />
        &nbsp;Test{' '}
        <Text as="span" css={{ display: 'none', containerMd: { display: 'inline' } }}>
          &nbsp; speaker
        </Text>
      </Button>
      <audio
        ref={audioRef}
        src={TEST_AUDIO_URL}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        css={{ display: 'none' }}
      />
    </>
  );
};

export default Settings;
