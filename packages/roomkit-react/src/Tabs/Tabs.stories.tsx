import React, { useEffect, useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Tabs } from '.';
import { Box } from '../Layout';
import { Text } from '../Text';

export default {
  title: 'UI Components/Tabs',
  component: Tabs.Root,
  argTypes: {
    value: { control: { type: 'text' }, defaultValue: 'tab1' },
    onValueChange: { action: { type: 'click' } },
    orientation: { options: ['horizontal', 'vertical'], defaultValue: 'horizontal', control: { type: 'select' } },
  },
} as ComponentMeta<typeof Tabs.Root>;

const Template: ComponentStory<typeof Tabs.Root> = ({
  value: propValue = '',
  onValueChange: propOnValueChange,
  ...rest
}) => {
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
    <Tabs.Root
      css={{
        gap: '8px',
        maxWidth: '500px',
        width: 'max-content',
        '&[data-orientation="horizontal"]': { flexDirection: 'column' },
      }}
      value={value}
      onValueChange={handleOnValueChange}
      {...rest}
    >
      <Tabs.List
        aria-label="tabs example"
        css={{ bg: '$bgSecondary', r: '$1', '&[data-orientation="vertical"]': { flexDirection: 'column' } }}
      >
        <Tabs.Trigger value="tab1">One</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Two</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Three</Tabs.Trigger>
      </Tabs.List>
      <Box css={{ r: '$1', bg: '$bgTertiary' }}>
        <Tabs.Content value="tab1">
          <Text>Tab one content</Text>
        </Tabs.Content>
        <Tabs.Content value="tab2">
          <Text>Tab two content</Text>
        </Tabs.Content>
        <Tabs.Content value="tab3">
          <Text>Tab three content</Text>
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export const Example = Template.bind({});
Example.storyName = 'Tabs';
