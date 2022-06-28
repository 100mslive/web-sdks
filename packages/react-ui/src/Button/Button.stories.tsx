import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Button } from './Button';
import { HangUpIcon } from '@100mslive/react-icons';
import ButtonDocs from './Button.mdx';
import React from 'react';

export default {
  title: 'UI Components/Button',
  component: Button,
  argTypes: { onClick: { action: 'clicked' } },
  parameters: {
    docs: {
      page: ButtonDocs,
    },
  },
} as ComponentMeta<typeof Button>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Button> = args => <Button {...args}>Hello World</Button>;

const WithIcon: ComponentStory<typeof Button> = args => (
  <Button {...args}>
    <HangUpIcon /> Leave Room
  </Button>
);

export const Primary = Template.bind({});

Primary.args = {
  variant: 'primary',
  outlined: false,
};

export const Standard = Template.bind({});

Standard.args = {
  variant: 'standard',
  outlined: false,
};

export const Danger = Template.bind({});

Danger.args = {
  variant: 'danger',
  outlined: false,
};

export const Icon = WithIcon.bind({});
Icon.args = {
  variant: 'danger',
  icon: true,
  outlined: false,
};
