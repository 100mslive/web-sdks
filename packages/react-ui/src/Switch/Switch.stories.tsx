import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Switch } from './Switch';
import SwitchDocs from './Switch.mdx';
import React from 'react';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Switch',
  component: Switch,
  argTypes: {
    asChild: { control: false },
  },
  args: {
    disabled: false,
    defaultChecked: true,
    required: false,
  },

  parameters: {
    docs: {
      page: SwitchDocs,
    },
  },
} as ComponentMeta<typeof Switch>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Switch> = args => {
  const [checked, onCheckedChange] = React.useState(false);
  return (
    <Flex align="center" justify="center" css={{ w: '$20', h: '$20' }}>
      <Switch checked={checked} onCheckedChange={onCheckedChange} {...args} />
    </Flex>
  );
};

export const Index = Template.bind({});

Index.args = {
  checked: false,
  onCheckedChange: () => {
    return;
  },
};
