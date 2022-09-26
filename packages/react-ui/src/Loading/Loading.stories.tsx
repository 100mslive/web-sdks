import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Loading } from './Loading';
import { Box } from '../Layout';

export default {
  title: 'UI Components/Loading',
  component: Loading,
  argTypes: {},
} as ComponentMeta<typeof Box>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Loading> = args => (
  <Box css={{ w: '200px' }}>
    <Loading {...args} />
  </Box>
);

export const Example = Template.bind({});
