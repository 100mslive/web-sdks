import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { AddIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { VerticalDivider } from '.';

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
    <Flex align="center" css={{ position: 'absolute', left: '10' }}>
      <Button icon variant="primary">
        <AddIcon />
        <Text as="span" variant="button" css={{ c: 'white' }}>
          Add Stuff
        </Text>
      </Button>
      <VerticalDivider space={space} css={{ bg: 'onPrimary.high', ...css }} />
      <Button icon variant="danger">
        <AddIcon />
        <Text as="span" variant="button" css={{ c: 'white' }}>
          Add Another Stuff
        </Text>
      </Button>
    </Flex>
  );
};

export const Vertical = VerticalDividerComponent.bind({});
