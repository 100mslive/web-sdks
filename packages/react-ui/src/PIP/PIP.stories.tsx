import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import mdx from './PIP.mdx';
import { PIPComponent } from './PIPComponent';

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
  return <PIPComponent />;
};

export const Example = Template.bind({});
Example.storyName = 'PIP';
