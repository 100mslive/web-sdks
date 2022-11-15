import React, { useEffect } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Switch } from './Switch';
import SwitchDocs from './Switch.mdx';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Switch',
  component: Switch,
  argTypes: {
    asChild: { control: false },
  },
  args: {
    disabled: false,
    checked: true,
    required: false,
  },
  parameters: {
    docs: {
      page: SwitchDocs,
    },
  },
} as ComponentMeta<typeof Switch>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Switch> = ({ checked: initialChecked, ...args }) => {
  const [checked, onCheckedChange] = React.useState(false);
  useEffect(() => {
    onCheckedChange(!!initialChecked);
  }, [initialChecked]);
  return (
    <Flex align="center" justify="center" css={{ w: '$20', h: '$20' }}>
      <Switch checked={checked} {...args} onCheckedChange={onCheckedChange} />
    </Flex>
  );
};

export const Playground = Template.bind({});

Playground.storyName = 'Switch';
Playground.args = {
  checked: false,
  onCheckedChange: () => {
    return;
  },
};
