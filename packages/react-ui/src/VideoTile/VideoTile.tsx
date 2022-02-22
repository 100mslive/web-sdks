import React, { useState } from 'react';
import {
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectPeerByID,
  selectPeerMetadata,
  useHMSStore,
  HMSPeerID,
} from '@100mslive/react-sdk';
import { StyledVideoTile } from './StyledVideoTile';
import { Video } from '../Video';
import { Avatar } from '../Avatar';
import { MicOffIcon, HandRaiseFilledIcon } from '@100mslive/react-icons';
import { TileMenu } from '../TileMenu/TileMenu';
import { VideoTileStats } from '../Stats';
import { useBorderAudioLevel } from '../AudioLevel';

interface Props {
  peerId: HMSPeerID;
  width: number;
  height: number;
}

export const VideoTile: React.FC<Props> = ({ peerId, width, height }) => {
  const peer = useHMSStore(selectPeerByID(peerId));
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));
  const isVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(peerId));
  const borderAudioRef = useBorderAudioLevel(peer?.audioTrack);
  const [showTrigger, setShowTrigger] = useState(false);
  const isHandRaised = useHMSStore(selectPeerMetadata(peerId))?.isHandRaised || false;
  return (
    <StyledVideoTile.Root
      css={{ width, height }}
      onMouseEnter={() => setShowTrigger(true)}
      onMouseLeave={() => {
        setShowTrigger(false);
      }}
    >
      <StyledVideoTile.Container ref={borderAudioRef}>
        <VideoTileStats audioTrackID={peer?.audioTrack} videoTrackID={peer?.videoTrack} />
        <Video mirror={peer?.isLocal || false} trackId={peer?.videoTrack} />
        {isVideoMuted ? <Avatar name={peer?.name || ''} /> : null}
        <StyledVideoTile.Info>{peer?.name}</StyledVideoTile.Info>
        {isAudioMuted ? (
          <StyledVideoTile.AudioIndicator>
            <MicOffIcon />
          </StyledVideoTile.AudioIndicator>
        ) : null}
        {showTrigger && !peer?.isLocal ? <TileMenu peerId={peerId} /> : null}
        {isHandRaised ? (
          <StyledVideoTile.AttributeBox>
            <HandRaiseFilledIcon width={40} height={40} />
          </StyledVideoTile.AttributeBox>
        ) : null}
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};
