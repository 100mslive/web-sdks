import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Input } from '.';

export default {
  title: 'UI Components/Input',
  component: Input,
  argTypes: {
    ref: { table: { disable: true } },
    as: { table: { disable: true } },
    placeholder: { control: { type: 'text' } },
    error: { control: { type: 'boolean' } },
  },
  args: {
    error: false,
    placeholder: 'This is a placeholder',
  },
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = args => {
  return <Input {...args} />;
};

export const Example = Template.bind({});
Example.storyName = 'Input';
