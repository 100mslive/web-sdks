import React from 'react';
import { useAVToggle, useHMSActions, useHMSStore, useVideoList, useVideoTile } from '@100mslive/react-sdk';
import { selectPeers } from '@100mslive/hms-video-store';
import { useResizeDetector } from 'react-resize-detector';
import { Avatar, IconButton, VideoTile, Tooltip } from '@100mslive/react-ui';
import {
  MicOnIcon,
  MicOffIcon,
  VideoOnIcon,
  VideoOffIcon,
  HangUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@100mslive/react-icons';
import { getAvatarBg } from '../utils/getAvatarBg';

const Room = () => {
  const peers = useHMSStore(selectPeers);
  const { width = 0, height = 0, ref } = useResizeDetector();
  const { chunkedTracksWithPeer } = useVideoList({
    maxColCount: 2,
    maxRowCount: 2,
    maxTileCount: 4,
    width,
    height,
    showScreenFn: () => false,
    overflow: 'scroll-x',
    peers,
    aspectRatio: {
      width: 1,
      height: 1,
    },
  });
  const [page, setPage] = React.useState(0);
  const nextPage = () => {
    // last
    if (page === chunkedTracksWithPeer.length - 1) {
      setPage(0);
    } else {
      setPage(page + 1);
    }
  };
  const prevPage = () => {
    // prev
    if (page === 0) {
      setPage(chunkedTracksWithPeer.length - 1);
    } else {
      setPage(page - 1);
    }
  };
  console.log(chunkedTracksWithPeer);
  return (
    <div className="room-view">
      <div className="room-nav" />
      {chunkedTracksWithPeer && chunkedTracksWithPeer.length > 0 && (
        <div ref={ref} className="videolist">
          {chunkedTracksWithPeer[page].map((trackPeer, _) => (
            <VideoTileComp
              key={trackPeer.track ? trackPeer.track.id : trackPeer.peer.id}
              peer={trackPeer.peer}
              width={trackPeer.width}
              height={trackPeer.height}
            />
          ))}
          {chunkedTracksWithPeer.length > 1 ? (
            <div className="pagin-ctx">
              <div onClick={prevPage}>
                <ChevronLeftIcon className="chevron" />
              </div>
              {chunkedTracksWithPeer.map((_, i: number) => (
                <div className={`pagin-btn ${i === page ? 'pagin-active' : null}`} onClick={() => setPage(i)} />
              ))}
              <div onClick={nextPage}>
                <ChevronRightIcon className="chevron" />
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div className="room-footer">
        <Controls />
      </div>
    </div>
  );
};

const VideoTileComp = ({ peer, width, height }) => {
  const { videoRef, isVideoOn, isAudioOn, isLocal, audioLevel } = useVideoTile(peer);
  const { color, initials } = getAvatarBg(peer.name);
  return (
    <VideoTile.Container style={{ width, height, position: 'relative' }}>
      <VideoTile.Video audioLevel={audioLevel} local={isLocal} autoPlay muted playsInline ref={videoRef} />
      {isVideoOn ? null : (
        <VideoTile.AvatarContainer>
          <Avatar size={width < 200 ? 'md' : 'lg'} style={{ backgroundColor: color }}>
            {initials}
          </Avatar>
        </VideoTile.AvatarContainer>
      )}
      <VideoTile.Info>
        {!isAudioOn ? (
          <VideoTile.AudioIndicator>
            <MicOffIcon />
          </VideoTile.AudioIndicator>
        ) : null}
        {isLocal ? `${peer.name} (You)` : peer.name}
      </VideoTile.Info>
    </VideoTile.Container>
  );
};

const Controls = () => {
  const { isAllowedToPublish, isLocalAudioEnabled, isLocalVideoEnabled, toggleAudio, toggleVideo } = useAVToggle();
  const actions = useHMSActions();
  const leaveRoom = () => actions.leave();
  return (
    <>
      {isAllowedToPublish.audio ? (
        <Tooltip title={isLocalAudioEnabled ? 'Turn off audio' : 'Turn on audio'}>
          <IconButton active={isLocalAudioEnabled} onClick={toggleAudio}>
            {isLocalAudioEnabled ? <MicOnIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>
      ) : null}
      {isAllowedToPublish.video ? (
        <Tooltip title={isLocalVideoEnabled ? 'Turn off video' : 'Turn on video'}>
          <IconButton active={isLocalVideoEnabled} onClick={toggleVideo}>
            {isLocalVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
          </IconButton>
        </Tooltip>
      ) : null}
      <Tooltip title={'Leave room'}>
        <IconButton css={{ bg: '$redMain' }} onClick={leaveRoom}>
          <HangUpIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default Room;
