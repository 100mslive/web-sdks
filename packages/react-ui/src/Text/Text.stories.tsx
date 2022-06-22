import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Text } from './Text';

export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'UI Components/Text',
  component: Text,
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'sub1',
          'sub2',
          'body1',
          'body2',
          'button',
          'caption',
          'overline',
          'tiny',
          'xs',
          'sm',
          'md',
        ],
      },
    },
  },
} as ComponentMeta<typeof Text>;

const Template: ComponentStory<typeof Text> = args => <Text {...args}>The Evil Rabbit jumps.</Text>;

export const Primary = Template.bind({});

Primary.args = {};
