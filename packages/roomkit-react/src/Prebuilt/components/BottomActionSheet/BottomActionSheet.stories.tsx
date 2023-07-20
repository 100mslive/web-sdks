import React, { ReactElement } from 'react';
import { Meta } from '@storybook/react';
import BottomActionSheet from './BottomActionSheet';
import { Button } from '../../../Button';
import { Box } from '../../../Layout';
import { Text } from '../../../Text';
import { CSS } from '../../../Theme';

// WIP

export default {
  title: 'Components/BottomActionSheet',
  component: BottomActionSheet,
  argTypes: {
    title: { control: 'text' },
    triggerContent: { control: 'jsx' },
    containerCSS: { control: 'object' },
    sideOffset: { control: 'number' },
    defaultHeight: { control: 'number' },
  },
} as Meta;

interface BottomActionSheetProps {
  title: string;
  triggerContent: ReactElement;
  children: ReactElement;
  containerCSS: CSS;
  sideOffset: number;
  defaultHeight: number;
}

const Template = (args: BottomActionSheetProps) => (
  <BottomActionSheet {...args}>
    <Box>
      <Text>This is the content of the BottomActionSheet.</Text>
      <Text>You can put any content you like here.</Text>
    </Box>
  </BottomActionSheet>
);

// Example story with default props
export const Default = Template.bind({});
Default.args = {
  title: 'Example BottomActionSheet',
  triggerContent: <Button>Open BottomActionSheet</Button>,
};
