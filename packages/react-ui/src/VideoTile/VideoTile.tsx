import React, { useState } from 'react';
import { selectIsPeerAudioEnabled, selectIsPeerVideoEnabled } from '@100mslive/react-sdk';
import { useHMSStore, HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoTile } from './StyledVideoTile';
import { Video } from '../Video';
import { Avatar } from '../Avatar';
import { MicOffIcon } from '@100mslive/react-icons';
import { TileMenu } from '../TileMenu';

interface Props {
  peer: HMSPeer;
  width: number;
  height: number;
}

export const VideoTile: React.FC<Props> = ({ peer, width, height }) => {
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peer.id));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const [showTrigger, setShowTrigger] = useState(false);
  return (
    <StyledVideoTile.Container
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => {
        setShowTrigger(false);
      }}
      css={{ width, height }}
    >
      <Video isLocal={peer.isLocal} trackId={peer.videoTrack} />
      {isVideoMuted ? <Avatar size="lg" name={peer.name} /> : null}
      <StyledVideoTile.Info>{peer.name}</StyledVideoTile.Info>
      {isAudioMuted ? (
        <StyledVideoTile.AudioIndicator>
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      ) : null}
      {showTrigger && !peer.isLocal ? <TileMenu id={peer.id} /> : null}
    </StyledVideoTile.Container>
  );
};
