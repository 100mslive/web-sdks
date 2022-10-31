import React from 'react';
import mdx from './UsePreviewJoin.mdx';
import { Box } from '../Layout';

const PreviewJoin = () => {
  return (
    <Box>
    </Box>
  );
};

const PreviewJoinStory = {
  title: 'Hooks/usePreviewJoin',
  component: PreviewJoin,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default PreviewJoinStory;

export const UsePreviewJoin = PreviewJoin.bind({});
UsePreviewJoin.storyName = 'usePreviewJoin';
