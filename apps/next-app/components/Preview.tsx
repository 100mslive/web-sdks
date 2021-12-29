import React from 'react';
import { Button, IconButton, Preview, Input, Loading, Avatar, Dialog, Select, Flex, Text } from '@100mslive/react-ui';
import { MicOffIcon, MicOnIcon, SettingIcon, VideoOffIcon, VideoOnIcon } from '@100mslive/react-icons';
import { useDevices, useHMSActions, usePreview, useVideoTile } from '@100mslive/react-sdk';
import { getAvatarBg } from '../utils/getAvatarBg';
import Layout from '../layout/Layout';
import getToken from '../utils/getToken';

export default function PreviewView() {
  const [token, setToken] = React.useState('');
  React.useEffect(() => {
    getToken('host')
      .then(t => setToken(t))
      .catch(e => console.log(e));
  }, []);
  return <Layout>{token ? <PreviewScreen token={token} /> : <Loading size={100} />}</Layout>;
}

const PreviewScreen = ({ token }) => {
  const actions = useHMSActions();
  const { localPeer, audioEnabled, videoEnabled } = usePreview(token, 'preview');
  const [name, setName] = React.useState('');
  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    actions.join({
      userName: name,
      authToken: token,
      settings: {
        isAudioMuted: !audioEnabled,
        isVideoMuted: !videoEnabled,
      },
    });
  };
  return (
    <Preview.Container>
      {localPeer ? <PreviewVideo name={name} peer={localPeer} /> : <VideoLoader />}
      <div className="flex flex-col items-center my-4">
        <p className="pretext">Hi there</p>
        <p className="prename">What your name?</p>
        <form onSubmit={joinRoom}>
          <Input value={name} onChange={e => setName(e.target.value)} type="text" variant="compact" />
        </form>
      </div>
      <Button>Join</Button>
    </Preview.Container>
  );
};

const PreviewVideo = ({ peer, name }) => {
  const { color, initials } = getAvatarBg(name);
  const actions = useHMSActions();
  const { videoRef, isLocal, isAudioOn, isVideoOn, audioLevel } = useVideoTile(peer);
  return (
    <Preview.VideoRoot audioLevel={audioLevel}>
      {isVideoOn ? (
        <Preview.Video local={isLocal} ref={videoRef} autoPlay muted playsInline />
      ) : (
        <Avatar size="lg" style={{ backgroundColor: color }}>
          {initials}
        </Avatar>
      )}
      <Preview.Controls>
        <IconButton active={isAudioOn} onClick={() => actions.setLocalAudioEnabled(!isAudioOn)}>
          {isAudioOn ? <MicOnIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton active={isVideoOn} onClick={() => actions.setLocalVideoEnabled(!isVideoOn)}>
          {isVideoOn ? <VideoOnIcon /> : <VideoOffIcon />}
        </IconButton>
      </Preview.Controls>
      <Preview.Setting>
        <PreviewSetting />
      </Preview.Setting>
      <Preview.BottomOverlay />
    </Preview.VideoRoot>
  );
};

const PreviewSetting = () => {
  const {
    showVideo,
    videoInput,
    showAudio,
    audioInput,
    handleInputChange,
    selectedDevices,
    isSubscribing,
    audioOutput,
  } = useDevices();
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <IconButton>
          <SettingIcon />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content title="Settings">
        {showVideo ? (
          <Flex align="center" justify="between" css={{ my: '1rem' }}>
            <Text variant="heading-sm">Camera:</Text>
            <Select
              // @ts-ignore
              onChange={handleInputChange}
              value={selectedDevices.videoInputDeviceId}
            >
              {videoInput.map(device => (
                <option value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </Select>
          </Flex>
        ) : null}
        {showAudio ? (
          <Flex align="center" justify="between" css={{ my: '1rem' }}>
            <Text variant="heading-sm">Microphone:</Text>
            <Select
              // @ts-ignore
              onChange={handleInputChange}
              value={selectedDevices.audioInputDeviceId}
            >
              {audioInput.map(device => (
                <option value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </Select>
          </Flex>
        ) : null}
        {isSubscribing && audioOutput.length > 0 ? (
          <Flex align="center" justify="between" css={{ my: '1rem' }}>
            <Text variant="heading-sm">Speaker:</Text>
            <Select
              // @ts-ignore
              onChange={handleInputChange}
              value={selectedDevices.audioOutputDeviceId}
            >
              {audioOutput.map(device => (
                <option value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </Select>
          </Flex>
        ) : null}
      </Dialog.Content>
    </Dialog>
  );
};

const VideoLoader = () => (
  <div className="video-loader">
    <Loading size={90} />
  </div>
);
