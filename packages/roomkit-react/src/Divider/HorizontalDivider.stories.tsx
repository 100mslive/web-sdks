import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { HorizontalDivider } from '.';

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
    <Flex align="center" direction="column" css={{ width: 'max-content', bg: 'surface.bright', p: '8', r: '4' }}>
      <ul style={{ listStyle: 'none', padding: '0px', margin: '0px', textAlign: 'center' }}>
        <Text as="li">Item 1</Text>
        <Text as="li">Item 2</Text>
        <Text as="li">Item 3</Text>
        <HorizontalDivider space={space} css={{ bg: 'onPrimary.medium', width: '80px', ...css }} />
        <Text as="li">Item 4</Text>
        <Text as="li">Item 5</Text>
        <Text as="li">Item 6</Text>
      </ul>
    </Flex>
  );
};

export const Horizontal = HorizontalDividerComponent.bind({});
