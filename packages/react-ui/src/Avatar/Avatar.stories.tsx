import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Avatar } from '.';

export default {
  title: 'UI Components/Avatar',
  component: Avatar,
  argTypes: {
    ref: { table: { disable: true } },
  },
  args: {
    name: '100ms',
  },
} as ComponentMeta<typeof Avatar>;

export const Square: ComponentStory<typeof Avatar> = args => {
  return <Avatar css={{ width: '50px', height: '50px' }} shape="square" {...args} />;
};

export const Circle: ComponentStory<typeof Avatar> = args => {
  return <Avatar css={{ width: '50px', height: '50px' }} shape="circle" {...args} />;
};

export const Playground = ({ height = 50, width = 50, css = {}, shape = 'circle' as const, name = '' }) => {
  return <Avatar css={{ width: width, height: height, ...css }} name={name} shape={shape} />;
};

Playground.storyName = 'Avatar';
Playground.argTypes = {
  height: { control: { type: 'number' } },
  width: { control: { type: 'number' } },
  shape: { options: ['square', 'circle'], defaultValue: 'square', control: { type: 'select' } },
};
