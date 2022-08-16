import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { PasswordInput } from './Input';
import { Box } from '../Layout';

export default {
  title: 'UI Components/PasswordInput',
  component: PasswordInput,
  args: {
    copyIconStyle: {},
    passwordIconStyle: {},
  },
  argTypes: {
    onChange: { action: 'clicked' },
    onCopy: { action: 'clicked' },
    hasPassword: { control: 'boolean' },
    hasCopy: { control: 'boolean' },
    loading: { control: 'boolean' },
    css: { control: 'object' },
    copyIconStyle: { control: 'object' },
    passwordIconStyle: { control: 'object' },
  },
} as ComponentMeta<typeof PasswordInput>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof PasswordInput> = args => (
  <Box css={{ w: '240px' }}>
    <PasswordInput {...args} />
  </Box>
);

export const Example = Template.bind({});
