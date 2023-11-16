import React from 'react';
import { MicOffIcon } from '@100mslive/react-icons';
import { Video } from '../Video/Video';
import { StyledVideoTile } from './StyledVideoTile';
import VideoTileDocs from './VideoTile.mdx';

const VideoTileMeta = {
  title: 'Video/VideoTile',
  parameters: {
    docs: {
      page: VideoTileDocs,
    },
  },
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
