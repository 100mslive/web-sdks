import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Flex } from '../Layout';
import mdx from './Loading.mdx';
import { Loading } from '.';

export default {
  title: 'UI Components/Loading',
  component: Loading,
  parameters: {
    docs: {
      page: mdx,
    },
  },
} as ComponentMeta<typeof Loading>;

const Template: ComponentStory<typeof Loading> = ({ color }) => {
  return (
    <Flex gap={4}>
      <Loading size={24} color={color} />
      <Loading size={48} color={color} />
      <Loading size={64} color={color} />
    </Flex>
  );
};

export const Multiple = Template.bind({});
Multiple.args = {
  color: 'red',
};

export const Playground: ComponentStory<typeof Loading> = args => <Loading {...args} />;
Playground.storyName = 'Loading';
Playground.argTypes = {
  size: { control: { type: 'number' }, defaultValue: 24 },
  color: { defaultValue: 'blue' },
};
