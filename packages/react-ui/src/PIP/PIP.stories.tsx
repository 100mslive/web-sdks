import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import mdx from './PIP.mdx';
import { PIPComponent } from './PIPComponent';
import { Box, Flex } from '../Layout';
import { VideoListStory } from '../VideoList/VideoList.stories';

export default {
  title: 'UI Components/PIP',
  component: PIPComponent,
  parameters: {
    docs: {
      page: mdx,
    },
  },
} as ComponentMeta<typeof PIPComponent>;

const Template: ComponentStory<typeof PIPComponent> = _args => {
  return (
    <Flex>
      <VideoListStory
        maxTileCount={2}
        aspectRatio={{
          width: 2,
          height: 1,
        }}
      />
      <Box css={{ maxHeight: 'max-content', mt: "$10"}}>
        <PIPComponent />
      </Box>
    </Flex>
  );
};

export const Example = Template.bind({});
Example.storyName = 'PIP';
