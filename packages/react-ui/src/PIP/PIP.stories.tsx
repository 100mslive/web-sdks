import React, { Fragment } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import mdx from './PIP.mdx';
import { PIPComponent } from './PIPComponent';
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
    <Fragment>
      <VideoListStory
        maxTileCount={2}
        aspectRatio={{
          width: 2,
          height: 1,
        }}
      />
      <PIPComponent />;
    </Fragment>
  );
};

export const Example = Template.bind({});
Example.storyName = 'PIP';
