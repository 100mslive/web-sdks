import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { PasswordInput } from './Input';
import { Box } from '../Layout';

export default {
  title: 'UI Components/PasswordInput',
  component: PasswordInput,
  argTypes: {},
} as ComponentMeta<typeof PasswordInput>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof PasswordInput> = args => (
  <Box css={{ w: '240px' }}>
    <PasswordInput {...args} />
  </Box>
);

export const Example = Template.bind({});
