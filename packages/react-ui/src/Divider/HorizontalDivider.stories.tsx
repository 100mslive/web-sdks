import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { HorizontalDivider } from '.';
import { Button } from '../Button';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Divider',
  component: HorizontalDivider,
  argTypes: {
    ref: { table: { disable: true } },
    as: { table: { disable: true } },
    css: { table: { disable: true } },
    space: { defaultValue: 1, control: { type: 'number', min: 1, max: 4 } },
  },
} as ComponentMeta<typeof HorizontalDivider>;

const HorizontalDividerComponent: ComponentStory<typeof HorizontalDivider> = ({ space, css }) => {
  return (
    <Flex
      align="center"
      direction="column"
      css={{ width: 'max-content', bg: '$bgTertiary', p: '$8', r: '$4', '> button': { w: '100%' } }}
    >
      <Button>Hello</Button>
      <HorizontalDivider space={space} css={{ bg: '$textSecondary', width: '80px', ...css }} />
      <Button>Sailor</Button>
    </Flex>
  );
};

export const Horizontal = HorizontalDividerComponent.bind({});
