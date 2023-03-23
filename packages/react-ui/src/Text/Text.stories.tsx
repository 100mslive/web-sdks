import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Text, textVariants } from './Text';

export default {
  title: 'UI Components/Text',
  component: Text,
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: Object.keys(textVariants),
      },
    },
  },
} as ComponentMeta<typeof Text>;

const Template: ComponentStory<typeof Text> = args => <Text {...args}>The Evil Rabbit jumps.</Text>;

export const Playground = Template.bind({});
Playground.storyName = 'Text';
