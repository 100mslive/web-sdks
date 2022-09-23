import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { HorizontalDivider } from '.';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Divider',
  component: HorizontalDivider,
  argTypes: {
    ref: { table: { disable: true } },
    as: { table: { disable: true } },
    css: { control: { type: 'object' } },
    space: { defaultValue: 1, control: { type: 'number', min: 1, max: 4 } },
  },
} as ComponentMeta<typeof HorizontalDivider>;

const HorizontalDividerComponent: ComponentStory<typeof HorizontalDivider> = ({ space, css }) => {
  return (
    <Flex align="center" direction="column" css={{ maxWidth: '500px' }}>
      <div style={{ height: '20px', width: '20px', backgroundColor: 'red' }}></div>
      <HorizontalDivider space={space} css={{ bg: '$textPrimary', ...css }} />
      <div style={{ height: '20px', width: '20px', backgroundColor: 'green' }}></div>
    </Flex>
  );
};

export const Horizontal = HorizontalDividerComponent.bind({});
