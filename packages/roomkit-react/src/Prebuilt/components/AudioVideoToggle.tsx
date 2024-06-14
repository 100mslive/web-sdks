import React, { Fragment, useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import {
  DeviceType,
  HMSRoomState,
  selectLocalAudioTrackID,
  selectLocalPeer,
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
import { AudioLevel } from '../../AudioLevel';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Switch } from '../../Switch';
import { Text } from '../../Text';
import { config as cssConfig } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import {
  useNoiseCancellationPlugin,
  useSetNoiseCancellationEnabled,
  // @ts-ignore: No implicit Any
} from './AppData/useUISettings';
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

const NoiseCancellation = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const localPeerAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const { isNoiseCancellationEnabled, setNoiseCancellationWithPlugin, inProgress } = useSetNoiseCancellationEnabled();
  const room = useHMSStore(selectRoom);
  const { krispPlugin, isKrispPluginAdded } = useNoiseCancellationPlugin();

  if (!krispPlugin.isSupported() || !room.isNoiseCancellationEnabled || !localPeerAudioTrackID) {
    return null;
  }

  if (isMobile) {
    return (
      <Text css={{ display: 'flex', alignItems: 'center', gap: '$2', fontSize: '$xs', '& svg': { size: '$8' } }}>
        <AudioLevelIcon />
        Reduce Noise
      </Text>
    );
  }
  return (
    <>
      <Dropdown.ItemSeparator css={{ mx: 0 }} />
      <Dropdown.Item
        css={{
          p: '$4 $8',
          h: '$15',
          fontSize: '$xs',
          justifyContent: 'space-between',
        }}
        onClick={async e => {
          e.preventDefault();
          await setNoiseCancellationWithPlugin(!isNoiseCancellationEnabled);
        }}
      >
        <Text css={{ display: 'flex', alignItems: 'center', gap: '$2', fontSize: '$xs', '& svg': { size: '$8' } }}>
          <AudioLevelIcon />
          Reduce Noise
        </Text>
        <Switch
          id="noise_cancellation"
          checked={isNoiseCancellationEnabled && isKrispPluginAdded}
          disabled={inProgress}
          onClick={e => e.stopPropagation()}
          onCheckedChange={async value => {
            await setNoiseCancellationWithPlugin(value);
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

export const AudioVideoToggle = ({ hideOptions = false }: { hideOptions?: boolean }) => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput, audioOutput } = allDevices;
  const localPeer = useHMSStore(selectLocalPeer);
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
  const { isKrispPluginAdded } = useNoiseCancellationPlugin();
  const { isNoiseCancellationEnabled, setNoiseCancellationWithPlugin } = useSetNoiseCancellationEnabled();
  const showMuteIcon = !isLocalAudioEnabled || !toggleAudio;

  useEffect(() => {
    (async () => {
      if (isNoiseCancellationEnabled && !isKrispPluginAdded && localPeer?.audioTrack) {
        await setNoiseCancellationWithPlugin(true);
        ToastManager.addToast({
          title: `Noise Reduction Enabled`,
          variant: 'standard',
          duration: 2000,
          icon: <AudioLevelIcon />,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNoiseCancellationEnabled, isKrispPluginAdded, localPeer?.audioTrack]);

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
            <OptionLabel icon={<MicOnIcon />}>
              <Box css={{ flex: '1 1 0' }}>{!shouldShowAudioOutput ? 'Audio' : 'Microphone'}</Box>
              {!showMuteIcon && <AudioLevel trackId={localPeer?.audioTrack} />}
            </OptionLabel>
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
