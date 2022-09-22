import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Loading } from '.';
import { Flex } from '../Layout';
import mdx from './Loading.mdx';

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

export const Example = Template.bind({});

export const Playground: ComponentStory<typeof Loading> = args => <Loading {...args} />;

Playground.argTypes = {
  size: { control: { type: 'number' }, defaultValue: 24 },
  color: { defaultValue: 'blue' },
};
