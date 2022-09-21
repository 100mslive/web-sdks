import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Input } from './Input';

export default {
  title: 'UI Components/Input',
  component: Input,
  argTypes: {},
} as ComponentMeta<typeof Input>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Input> = args => <Input {...args} />;

export const Example = Template.bind({});
