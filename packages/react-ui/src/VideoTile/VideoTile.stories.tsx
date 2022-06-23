import React from 'react';
import { StyledVideoTile } from './StyledVideoTile';
import { MicOffIcon } from '@100mslive/react-icons';
import Video from '../Video/Video';

const VideoTileMeta = {
  title: 'Video/VideoTile',
};

export default VideoTileMeta;

const VideoTileStory = () => {
  return (
    <StyledVideoTile.Root css={{ width: 500, height: 300 }}>
      <StyledVideoTile.Container>
        <Video trackId="1" />
        <StyledVideoTile.Info>Deepankar</StyledVideoTile.Info>
        <StyledVideoTile.AudioIndicator>
          <MicOffIcon />
        </StyledVideoTile.AudioIndicator>
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

export const Example = VideoTileStory.bind({});
