import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Avatar } from '.';

export default {
  title: 'UI Components/Avatar',
  component: Avatar,
  argTypes: {
    ref: { table: { disable: true } },
    shape: { defaultValue: 'square', control: { type: 'text' } },
  },
  args: {
    name: '100ms',
  },
} as ComponentMeta<typeof Avatar>;

const Template: ComponentStory<typeof Avatar> = args => {
  return <Avatar {...args} />;
};

export const Example = Template.bind({});
