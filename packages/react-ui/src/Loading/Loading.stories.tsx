import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Loading } from '.';
import mdx from './Loading.mdx';

export default {
  title: 'UI Components/Loading',
  component: Loading,
  argTypes: {
    size: { control: { type: 'number' }, defaultValue: 24 },
    color: { defaultValue: 'blue' },
  },
  parameters: {
    docs: {
      page: mdx,
    }
  }
} as ComponentMeta<typeof Loading>;

const Template: ComponentStory<typeof Loading> = ({ size, color }) => {
  return <Loading size={size} color={color} />;
};

export const Example = Template.bind({});
