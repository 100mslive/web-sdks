import React, { Fragment, useEffect, useState } from 'react';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';
import {
  DeviceType,
  HMSRoomState,
  selectIsLocalAudioPluginPresent,
  selectLocalAudioTrackID,
  selectLocalVideoTrackID,
  selectRoom,
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
  SettingsIcon,
  SpeakerIcon,
  VideoOffIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { IconButtonWithOptions } from './IconButtonWithOptions/IconButtonWithOptions';
// @ts-ignore: No implicit Any
import SettingsModal from './Settings/SettingsModal';
// @ts-ignore: No implicit Any
import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Switch } from '../../Switch';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
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
            backgroundColor: '$surface_dim',
            p: '$4 $8',
            h: '$15',
            fontSize: '$xs',
            justifyContent: 'space-between',
            color: selectedDeviceId === option.deviceId ? '$primary_bright' : '',
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
        color: '$on_surface_medium',
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
  const [active, setActive] = useState(isPluginAdded);
  const [inProgress, setInProgress] = useState(false);
  const actions = useHMSActions();
  const room = useHMSStore(selectRoom);

  useEffect(() => {
    (async () => {
      setInProgress(true);
      if (active && !isPluginAdded) {
        await actions.addPluginToAudioTrack(plugin);
      }
      if (!active && isPluginAdded) {
        await actions.removePluginFromAudioTrack(plugin);
      }
      setInProgress(false);
    })();
  }, [actions, active, isPluginAdded]);

  if (!plugin.isSupported() || !room.isNoiseCancellationEnabled || !localPeerAudioTrackID) {
    return null;
  }

  return (
    <>
      <Dropdown.Item
        css={{
          p: '$4 $8',
          h: '$15',
          fontSize: '$xs',
          justifyContent: 'space-between',
        }}
        onClick={e => {
          e.preventDefault();
          setActive(value => !value);
        }}
      >
        <Text css={{ display: 'flex', alignItems: 'center', gap: '$2', fontSize: '$xs', '& svg': { size: '$8' } }}>
          <AudioLevelIcon />
          Reduce Noise
        </Text>
        <Switch
          id="noise_cancellation"
          checked={active}
          disabled={inProgress}
          onClick={e => e.stopPropagation()}
          onCheckedChange={value => {
            setActive(value);
          }}
        />
      </Dropdown.Item>
      <Dropdown.ItemSeparator css={{ mx: 0 }} />
    </>
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

const AudioSettings = ({ onClick }: { onClick: () => void }) => {
  return (
    <>
      <Dropdown.Item
        css={{
          backgroundColor: '$surface_dim',
          p: '$4 $8',
          h: '$15',
          alignItems: 'center',
          gap: '$2',
          fontSize: '$xs',
          '& svg': { size: '$8' },
        }}
        onClick={onClick}
      >
        <SettingsIcon /> Audio Settings
      </Dropdown.Item>
    </>
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
  const { screenType } = useRoomLayoutConferencingScreen();
  const [showSettings, setShowSettings] = useState(false);

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
            <OptionLabel icon={<MicOnIcon />}>{!shouldShowAudioOutput ? 'Audio' : 'Microphone'}</OptionLabel>
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
          <AudioSettings onClick={() => setShowSettings(true)} />
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
      {showSettings && (
        <SettingsModal open={showSettings} onOpenChange={() => setShowSettings(false)} screenType={screenType} />
      )}
    </Fragment>
  );
};
