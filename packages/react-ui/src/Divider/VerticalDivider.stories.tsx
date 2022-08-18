import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { VerticalDivider } from '.';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Divider',
  component: VerticalDivider,
  argTypes: {
    ref: { table: { disable: true }, control: { type: null } },
    as: { table: { disable: true }, control: { type: null } },
    css: { control: { type: 'object' } },
    space: { defaultValue: 1, control: { type: 'number', min: 1, max: 4 } },
  },
} as ComponentMeta<typeof VerticalDivider>;

const VerticalDividerComponent: ComponentStory<typeof VerticalDivider> = ({ space, css }) => {
  return (
    <Flex align="center" css={{ position: 'absolute', left: '$10' }}>
      <div style={{ height: '20px', width: '20px', backgroundColor: 'red' }}></div>
      <VerticalDivider space={space} css={css} />
      <div style={{ height: '20px', width: '20px', backgroundColor: 'green' }}></div>
    </Flex>
  );
};

export const Vertical = VerticalDividerComponent.bind({});
