import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Select } from './Select';

export default {
  title: 'UI Components/Select',
  component: Select.Root,
} as ComponentMeta<typeof Select.Root>;

const Template: ComponentStory<typeof Select.Root> = () => {
  return (
    <Select.Root css={{ width: '70%' }}>
      <Select.DefaultDownIcon />
      <Select.Select css={{ width: '100%' }}>
        <option value="orange" key="orange">
          Orange
        </option>
        <option value="orange" key="apple">
          Apple
        </option>
        <option value="orange" key="banana">
          Banana
        </option>
        <option value="orange" key="grapes">
          Grapes
        </option>
      </Select.Select>
    </Select.Root>
  );
};

export const Single = Template.bind({});
Single.storyName = 'Select';
