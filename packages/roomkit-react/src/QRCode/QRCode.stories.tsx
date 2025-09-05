import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Flex } from '../Layout';
import { QRCode } from './QRCode';
import QRCodeDocs from './QRCode.mdx';

export default {
  title: 'UI Components/QRCode',
  id: 'qr-code',
  component: QRCode,
  args: {
    value: 'https://100ms.live',
    size: 128,
  },
  parameters: {
    docs: {
      page: QRCodeDocs,
    },
  },
} as ComponentMeta<typeof QRCode>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof QRCode> = ({ ...args }) => (
  <Flex css={{ w: '80' }} justify="center">
    <QRCode {...args} />
  </Flex>
);
export const Example = Template.bind({});
Example.storyName = 'QRCode';
