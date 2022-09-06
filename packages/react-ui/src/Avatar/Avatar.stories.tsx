import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Avatar } from '.';

export default {
  title: 'UI Components/Avatar',
  component: Avatar,
  argTypes: {
    ref: { table: { disable: true } },
    shape: { options: ['square', 'circle'], defaultValue: 'square', control: { type: 'select' } },
  },
  args: {
    name: '100ms',
  },
} as ComponentMeta<typeof Avatar>;

const Template: ComponentStory<typeof Avatar> = ({ css, ...rest }) => {
  return <Avatar css={{ width: '100px', height: '100px', ...css }} {...rest} />;
};

export const Example = Template.bind({});
