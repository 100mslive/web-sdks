import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Loading } from '.';

export default {
  title: 'UI Components/Loading',
  component: Loading,
  argTypes: {
    size: { control: { type: 'number' }, defaultValue: 12 },
  }
} as ComponentMeta<typeof Loading>;

const Template: ComponentStory<typeof Loading> = ({ size, color }) => {
  return <Loading size={size} color={color} />;
};

export const Example = Template.bind({});
