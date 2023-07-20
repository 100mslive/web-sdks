import React from 'react';
import { Meta } from '@storybook/react';
import { IconButtonWithOptions } from './IconButtonWithOptions';
import { MicIcon } from '@100mslive/react-icons';
import { Text } from '../../../Text';
import { Box } from '../../../Layout';

export default {
  title: 'Components/IconButtonWithOptions',
  component: IconButtonWithOptions,
  argTypes: {
    tooltipMessage: { control: 'text' },
    icon: { control: 'object' },
    options: { control: 'object' },
    buttonProps: { control: 'object' },
  },
} as Meta;

const Template = args => (
  <Box css={{ ml: '$20' }}>
    <IconButtonWithOptions {...args} />
  </Box>
);

export const Default = Template.bind({});
Default.args = {
  tooltipMessage: 'Click me!',
  icon: <MicIcon height={32} width={32} />,
  options: [
    { title: 'Option 1', content: <Text>Some content</Text> },
    { title: 'Option 2', content: <Text>Some more content</Text> },
  ],
  buttonProps: {},
};
