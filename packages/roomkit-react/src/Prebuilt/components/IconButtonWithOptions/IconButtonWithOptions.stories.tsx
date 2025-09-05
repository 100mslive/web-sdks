import React from 'react';
import { Meta } from '@storybook/react';
import { MicIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
import { Text } from '../../../Text';
import { IconButtonWithOptions } from './IconButtonWithOptions';

export default {
  title: 'Components/IconButtonWithOptions',
  component: IconButtonWithOptions,
  argTypes: {
    tooltipMessage: { control: 'text' },
    icon: { control: 'object' },
    options: { control: 'object' },
    active: { control: 'boolean' },
    onClick: { control: 'function' },
    key: { control: 'string' },
  },
} as Meta;

const Template = args => (
  <Box css={{ ml: '20', bg: 'background.dim', p: '8' }}>
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
  active: true,
  onClick: () => {
    return;
  },
  key: '',
};
