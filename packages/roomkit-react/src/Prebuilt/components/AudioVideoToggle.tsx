import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';
import {
  DeviceType,
  HMSRoomState,
  selectIsLocalAudioPluginPresent,
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
  useHMSVanillaStore,
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
import { ActionTile } from './MoreSettings/ActionTile';
// @ts-ignore: No implicit Any
import SettingsModal from './Settings/SettingsModal';
// @ts-ignore: No implicit Any
import { ToastManager } from './Toast/ToastManager';
import { AudioLevel } from '../../AudioLevel';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { Switch } from '../../Switch';
import { Text } from '../../Text';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useIsNoiseCancellationEnabled, useSetNoiseCancellation } from './AppData/useUISettings';
import { useAudioOutputTest } from './hooks/useAudioOutputTest';
import { isAndroid, isIOS, isMacOS, TEST_AUDIO_URL } from '../common/constants';

const krispPlugin = new HMSKrispPlugin();
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

const useNoiseCancellationWithPlugin = () => {
  const actions = useHMSActions();
  const [inProgress, setInProgress] = useState(false);
  const [, setNoiseCancellationEnabled] = useSetNoiseCancellation();
  const isEnabledForRoom = useHMSStore(selectRoom)?.isNoiseCancellationEnabled;
  const setNoiseCancellationWithPlugin = useCallback(
    async (enabled: boolean) => {
      if (!isEnabledForRoom || inProgress) {
        return;
      }
      if (!krispPlugin.checkSupport().isSupported) {
        throw Error('Krisp plugin is not supported');
      }
      setInProgress(true);
      if (enabled) {
        await actions.addPluginToAudioTrack(krispPlugin);
      } else {
        await actions.removePluginFromAudioTrack(krispPlugin);
      }
      setNoiseCancellationEnabled(enabled);
      setInProgress(false);
    },
    [actions, inProgress, isEnabledForRoom, setNoiseCancellationEnabled],
  );
  return {
    setNoiseCancellationWithPlugin,
    inProgress,
  };
};

export const NoiseCancellation = ({
  actionTile,
  iconOnly,
  setOpenOptionsSheet,
}: {
  setOpenOptionsSheet?: (value: boolean) => void;
  iconOnly?: boolean;
  actionTile?: boolean;
}) => {
  const localPeerAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const isNoiseCancellationEnabled = useIsNoiseCancellationEnabled();
  const { setNoiseCancellationWithPlugin, inProgress } = useNoiseCancellationWithPlugin();
  const room = useHMSStore(selectRoom);
  const isKrispPluginAdded = useHMSStore(selectIsLocalAudioPluginPresent(krispPlugin.getName()));

  if (!krispPlugin.isSupported() || !room.isNoiseCancellationEnabled || !localPeerAudioTrackID) {
    return null;
  }

  if (actionTile) {
    return (
      <ActionTile.Root
        active={isNoiseCancellationEnabled && isKrispPluginAdded}
        disabled={inProgress}
        onClick={async () => {
          await setNoiseCancellationWithPlugin(!isNoiseCancellationEnabled);
          setOpenOptionsSheet?.(false);
        }}
      >
        <AudioLevelIcon />
        <ActionTile.Title>{isNoiseCancellationEnabled ? 'Noise Reduced' : 'Reduce Noise'}</ActionTile.Title>
      </ActionTile.Root>
    );
  }

  if (iconOnly) {
    return (
      <Tooltip title={isNoiseCancellationEnabled ? 'Noise Reduced' : 'Reduce Noise'}>
        <IconButton
          onClick={async () => {
            await setNoiseCancellationWithPlugin(!isNoiseCancellationEnabled);
          }}
          disabled={inProgress}
          css={{
            bg: isNoiseCancellationEnabled && isKrispPluginAdded ? '$surface_brighter' : '$background_dim',
            borderColor: isNoiseCancellationEnabled && isKrispPluginAdded ? '$border_brighter' : '$border_bright',
          }}
        >
          <AudioLevelIcon />
        </IconButton>
      </Tooltip>
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
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices(error => {
    ToastManager.addToast({
      title: error.message,
      variant: 'error',
      duration: 2000,
    });
  });
  const { videoInput, audioInput, audioOutput } = allDevices;
  const localPeer = useHMSStore(selectLocalPeer);
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const videoTrackId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTrackId));
  const roomState = useHMSStore(selectRoomState);
  const hasAudioDevices = Number(audioInput?.length) > 0;
  const hasVideoDevices = Number(videoInput?.length) > 0;
  const shouldShowAudioOutput = 'setSinkId' in HTMLMediaElement.prototype && Number(audioOutput?.length) > 0;
  const { screenType } = useRoomLayoutConferencingScreen();
  const [showSettings, setShowSettings] = useState(false);
  const isKrispPluginAdded = useHMSStore(selectIsLocalAudioPluginPresent(krispPlugin.getName()));
  const isNoiseCancellationEnabled = useIsNoiseCancellationEnabled();
  const { setNoiseCancellationWithPlugin, inProgress } = useNoiseCancellationWithPlugin();
  const showMuteIcon = !isLocalAudioEnabled || !toggleAudio;

  useEffect(() => {
    (async () => {
      const isEnabledForRoom = vanillaStore.getState(selectRoom)?.isNoiseCancellationEnabled;
      if (
        isEnabledForRoom &&
        isNoiseCancellationEnabled &&
        !isKrispPluginAdded &&
        !inProgress &&
        localPeer?.audioTrack
      ) {
        try {
          await setNoiseCancellationWithPlugin(true);
        } catch (error) {
          console.error(error);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNoiseCancellationEnabled, localPeer?.audioTrack, inProgress]);

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
          testid="audio_toggle_btn"
          tooltipMessage={`Turn ${isLocalAudioEnabled ? 'off' : 'on'} audio (${isMacOS ? '⌘' : 'ctrl'} + d)`}
          icon={!isLocalAudioEnabled ? <MicOffIcon /> : <MicOnIcon />}
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
          testid="video_toggle_btn"
          icon={!isLocalVideoEnabled ? <VideoOffIcon /> : <VideoOnIcon />}
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

      {localVideoTrack?.facingMode && roomState === HMSRoomState.Preview && (isIOS || isAndroid) ? (
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
