import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Label } from '../Label';
import { Flex } from '../Layout';
import { RadioGroup } from './RadioGroup';

export default {
  title: 'UI Components/RadioGroup',
  component: RadioGroup.Root,
  argTypes: {},
} as ComponentMeta<typeof RadioGroup.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof RadioGroup.Root> = args => (
  <RadioGroup.Root {...args} css={{ flexDirection: 'column', alignItems: 'flex-start' }}>
    <Flex align="center" css={{ my: '4' }} gap="2">
      <RadioGroup.Item value="grid" id="gridView">
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <Label htmlFor="gridView">Grid View</Label>
    </Flex>
    <Flex align="center" css={{ cursor: 'pointer' }} gap="2">
      <RadioGroup.Item value="activespeaker" id="activeSpeaker">
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      <Label htmlFor="activeSpeaker">Active Speaker</Label>
    </Flex>
  </RadioGroup.Root>
);

export const Example = Template.bind({});
Example.storyName = 'RadioGroup';
