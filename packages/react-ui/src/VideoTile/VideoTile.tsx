import React, { useState } from 'react';
import { selectIsPeerAudioEnabled, selectIsPeerVideoEnabled, selectPeerMetadata } from '@100mslive/react-sdk';
import { useHMSStore, HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoTile } from './StyledVideoTile';
import { Video } from '../Video';
import { Avatar } from '../Avatar';
import { MicOffIcon, HandRaiseFilledIcon } from '@100mslive/react-icons';
import { TileMenu } from '../TileMenu';
import { AudioLevel } from '../AudioLevel';

interface Props {
  peer: HMSPeer;
  width: number;
  height: number;
}

export const VideoTile: React.FC<Props> = ({ peer, width, height }) => {
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peer.id));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const [showTrigger, setShowTrigger] = useState(false);
  const isHandRaised = useHMSStore(selectPeerMetadata(peer.id))?.isHandRaised || false;
  return (
    <StyledVideoTile.Root
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => {
        setShowTrigger(false);
      }}
    >
      <StyledVideoTile.Container css={{ width, height }}>
        <AudioLevel audioTrack={peer.audioTrack} />
        <Video isLocal={peer.isLocal} trackId={peer.videoTrack} />
        {isVideoMuted ? <Avatar size={getAvatarSize(width)} name={peer.name} /> : null}
        <StyledVideoTile.Info>{peer.name}</StyledVideoTile.Info>
        {isAudioMuted ? (
          <StyledVideoTile.AudioIndicator>
            <MicOffIcon />
          </StyledVideoTile.AudioIndicator>
        ) : null}
        {showTrigger && !peer.isLocal ? <TileMenu id={peer.id} /> : null}
        {isHandRaised ? (
          <StyledVideoTile.HandRaiseBox>
            <HandRaiseFilledIcon width={40} height={40} />
          </StyledVideoTile.HandRaiseBox>
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

const getAvatarSize = (width: number): 'lg' | 'md' | 'sm' | 'xs' => {
  if (width < 500) {
    return 'sm';
  } else {
    return 'md';
  }
};
