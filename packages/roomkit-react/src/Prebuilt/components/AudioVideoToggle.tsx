import React, { Fragment, useState } from 'react';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';
import {
  DeviceType,
  HMSRoomState,
  selectIsLocalAudioPluginPresent,
  selectLocalAudioTrackID,
  selectLocalVideoTrackID,
  selectRoomState,
  selectVideoTrackByID,
  useAVToggle,
  useDevices,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  AudioLevelIcon,
  CameraFlipIcon,
  CheckIcon,
  MicOffIcon,
  MicOnIcon,
  SpeakerIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { IconButtonWithOptions } from './IconButtonWithOptions/IconButtonWithOptions';
// @ts-ignore: No implicit Any
import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Label } from '../../Label';
import { Box, Flex } from '../../Layout';
import { Switch } from '../../Switch';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useAudioOutputTest } from './hooks/useAudioOutputTest';
import { isMacOS, TEST_AUDIO_URL } from '../common/constants';

// const optionsCSS = { fontWeight: '$semiBold', color: '$on_surface_high', w: '100%' };

export const Options = ({
  options,
  selectedDeviceId,
  onClick,
}: {
  options?: Array<MediaDeviceInfo | InputDeviceInfo>;
  selectedDeviceId?: string;
  onClick: (deviceId: string) => Promise<void>;
}) => {
  return (
    <>
      {options?.map(option => (
        <Dropdown.Item
          key={option.label}
          css={{
            backgroundColor: selectedDeviceId === option.deviceId ? '$surface_bright' : '$surface_dim',
            p: '$4 $8',
            h: '$15',
            fontSize: '$xs',
            justifyContent: 'space-between',
          }}
          onClick={() => {
            onClick(option.deviceId);
          }}
        >
          {option.label}
          {selectedDeviceId === option.deviceId ? <CheckIcon width={16} height={16} /> : null}
        </Dropdown.Item>
      ))}
    </>
  );
};

const OptionLabel = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => {
  return (
    <Dropdown.Label
      css={{
        h: '$16',
        p: '$4 $8',
        color: '$on_surface_low',
        bg: 'transparent',
        fontSize: '$xs',
        gap: '$4',
        alignItems: 'center',
      }}
    >
      <Flex css={{ alignItems: 'center', justifyContent: 'center', '& svg': { size: '$8' } }}>{icon}</Flex> {children}
    </Dropdown.Label>
  );
};

const plugin = new HMSKrispPlugin();
const NoiseCancellation = () => {
  const localPeerAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const isPluginAdded = useHMSStore(selectIsLocalAudioPluginPresent(plugin.getName()));
  const [active, setActive] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const actions = useHMSActions();

  if (!plugin.isSupported() || !localPeerAudioTrackID) {
    return null;
  }
  return (
    <Dropdown.Item
      css={{
        p: '$4',
        h: '$15',
        fontSize: '$xs',
        justifyContent: 'space-between',
      }}
      onClick={e => {
        e.preventDefault();
      }}
    >
      <Label
        htmlFor="noise_cancellation"
        css={{ display: 'flex', alignItems: 'center', gap: '$2', fontSize: '$xs', '& svg': { size: '$8' } }}
      >
        <AudioLevelIcon />
        Reduce Noise
      </Label>
      <Switch
        id="noise_cancellation"
        checked={active}
        disabled={inProgress}
        onCheckedChange={async value => {
          setInProgress(true);
          if (value && !isPluginAdded) {
            await actions.addPluginToAudioTrack(plugin);
          }
          if (!value && isPluginAdded) {
            await actions.removePluginFromAudioTrack(plugin);
          }
          setInProgress(false);
          setActive(value);
        }}
      />
    </Dropdown.Item>
  );
};

const AudioOutputLabel = ({ deviceId }: { deviceId: string }) => {
  const { playing, setPlaying, audioRef } = useAudioOutputTest({ deviceId });
  return (
    <OptionLabel icon={<SpeakerIcon />}>
      <Box css={{ flex: '1 1 0' }}>Speakers</Box>
      <Text
        variant="xs"
        css={{ color: '$primary_bright', '&:hover': { cursor: 'pointer' } }}
        onClick={async () => {
          if (playing) {
            return;
          }
          await audioRef.current?.play();
        }}
      >
        <audio
          ref={audioRef}
          src={TEST_AUDIO_URL}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          style={{ display: 'none' }}
        />
        {playing ? 'Playing Sound...' : 'Play Test Sound'}
      </Text>
    </OptionLabel>
  );
};

export const AudioVideoToggle = ({ hideOptions = false }) => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput, audioOutput } = allDevices;
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const videoTrackId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTrackId));
  const roomState = useHMSStore(selectRoomState);
  const hasAudioDevices = Number(audioInput?.length) > 0;
  const hasVideoDevices = Number(videoInput?.length) > 0;
  const shouldShowAudioOutput = 'setSinkId' in HTMLMediaElement.prototype && Number(audioOutput?.length) > 0;

  if (!toggleAudio && !toggleVideo) {
    return null;
  }

  return (
    <Fragment>
      {toggleAudio ? (
        <IconButtonWithOptions
          disabled={!toggleAudio}
          hideOptions={hideOptions || !hasAudioDevices}
          onDisabledClick={toggleAudio}
          tooltipMessage={`Turn ${isLocalAudioEnabled ? 'off' : 'on'} audio (${isMacOS ? '⌘' : 'ctrl'} + d)`}
          icon={
            !isLocalAudioEnabled ? <MicOffIcon data-testid="audio_off_btn" /> : <MicOnIcon data-testid="audio_on_btn" />
          }
          active={isLocalAudioEnabled}
          onClick={toggleAudio}
          key="toggleAudio"
        >
          <Dropdown.Group>
            <OptionLabel icon={<MicOnIcon />}>{shouldShowAudioOutput ? 'Audio' : 'Audio Input'}</OptionLabel>
            <Options
              options={audioInput}
              selectedDeviceId={selectedDeviceIDs.audioInput}
              onClick={deviceId => updateDevice({ deviceId, deviceType: DeviceType.audioInput })}
            />
          </Dropdown.Group>
          <Dropdown.ItemSeparator css={{ mx: 0 }} />
          {shouldShowAudioOutput && (
            <>
              <AudioOutputLabel deviceId={selectedDeviceIDs.audioOutput || ''} />
              <Dropdown.Group>
                <Options
                  options={audioOutput}
                  selectedDeviceId={selectedDeviceIDs.audioOutput}
                  onClick={deviceId => updateDevice({ deviceId, deviceType: DeviceType.audioOutput })}
                />
              </Dropdown.Group>
            </>
          )}
          <Dropdown.ItemSeparator css={{ mx: 0 }} />
          <NoiseCancellation />
        </IconButtonWithOptions>
      ) : null}

      {toggleVideo ? (
        <IconButtonWithOptions
          disabled={!toggleVideo}
          hideOptions={hideOptions || !hasVideoDevices}
          onDisabledClick={toggleVideo}
          tooltipMessage={`Turn ${isLocalVideoEnabled ? 'off' : 'on'} video (${isMacOS ? '⌘' : 'ctrl'} + e)`}
          icon={
            !isLocalVideoEnabled ? (
              <VideoOffIcon data-testid="video_off_btn" />
            ) : (
              <VideoOnIcon data-testid="video_on_btn" />
            )
          }
          key="toggleVideo"
          active={isLocalVideoEnabled}
          onClick={toggleVideo}
        >
          <Options
            options={videoInput}
            selectedDeviceId={selectedDeviceIDs.videoInput}
            onClick={deviceId => updateDevice({ deviceId, deviceType: DeviceType.videoInput })}
          />
        </IconButtonWithOptions>
      ) : null}

      {localVideoTrack?.facingMode && roomState === HMSRoomState.Preview ? (
        <Tooltip title="Switch Camera" key="switchCamera">
          <IconButton
            onClick={async () => {
              try {
                await actions.switchCamera();
              } catch (e) {
                ToastManager.addToast({
                  title: `Error while flipping camera ${(e as Error).message || ''}`,
                  variant: 'error',
                });
              }
            }}
          >
            <CameraFlipIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </Fragment>
  );
};
