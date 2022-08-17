import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { RadioGroup } from './RadioGroup';
import { Flex } from '../Layout';
import { Label } from '../Label';

export default {
  title: 'UI Components/RadioGroup',
  component: RadioGroup.Root,
  argTypes: {},
} as ComponentMeta<typeof RadioGroup.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof RadioGroup.Root> = args => (
  <RadioGroup.Root {...args} css={{ flexDirection: 'column', alignItems: 'flex-start' }}>
    <Flex align="center" css={{ my: '$4' }}>
      <RadioGroup.Item value="grid" id="gridView" css={{ mr: '$4' }}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <Label htmlFor="gridView">Grid View</Label>
    </Flex>
    <Flex align="center" css={{ cursor: 'pointer' }}>
      <RadioGroup.Item value="activespeaker" id="activeSpeaker" css={{ mr: '$4' }}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <Label htmlFor="activeSpeaker">Active Speaker</Label>
    </Flex>
  </RadioGroup.Root>
);

export const Example = Template.bind({});
