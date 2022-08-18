import React, { useEffect, useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Tabs } from '.';

export default {
  title: 'UI Components/Tabs',
  component: Tabs.Root,
  argTypes: {
    value: { control: { type: 'text' } },
    onValueChange: { action: { type: 'click' } },
  },
} as ComponentMeta<typeof Tabs.Root>;

const Template: ComponentStory<typeof Tabs.Root> = ({ value: propValue = '', onValueChange: propOnValueChange }) => {
  const [value, setValue] = useState('tab1');

  function handleOnValueChange(value: string) {
    setValue(value);
    if (propOnValueChange) {
      propOnValueChange(value);
    }
  }

  useEffect(() => {
    handleOnValueChange(propValue);
    if (propOnValueChange) {
      propOnValueChange(value);
    }
  }, [propValue]);

  return (
    <Tabs.Root value={value} onValueChange={handleOnValueChange}>
      <Tabs.List aria-label="tabs example">
        <Tabs.Trigger value="tab1">One</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Two</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Three</Tabs.Trigger>
      </Tabs.List>
      <div>
        <Tabs.Content value="tab1">Tab one content</Tabs.Content>
        <Tabs.Content value="tab2">Tab two content</Tabs.Content>
        <Tabs.Content value="tab3">Tab three content</Tabs.Content>
      </div>
    </Tabs.Root>
  );
};

export const Example = Template.bind({});
