import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { HangUpIcon } from '@100mslive/react-icons';
import { Button } from './Button';
import mdx from './Button.mdx';

export default {
  title: 'UI Components/Button',
  component: Button,
  argTypes: {
    variant: {
      description: 'Button styled variants',
    },
    outlined: { description: 'Give button an outlined style' },
    icon: { description: 'Give space between children' },
    loading: { description: 'Button is in a loading state' },
  },
  parameters: {
    docs: {
      page: mdx,
    },
  },
} as ComponentMeta<typeof Button>;

export const Primary = () => <Button variant="primary">Hello, World</Button>;

export const Standard = () => <Button variant="standard">Hello, World</Button>;

export const Danger = () => <Button variant="danger">Hello, World</Button>;

export const WithIcon = () => (
  <Button variant="danger" icon>
    <HangUpIcon />
    Leave Room
  </Button>
);

export const Playground: ComponentStory<typeof Button> = args => <Button {...args}>Hello World</Button>;

Playground.storyName = 'Button';
Playground.argTypes = {
  onClick: { action: 'clicked' },
  variant: {
    control: {
      type: 'select',
      options: ['primary', 'standard', 'danger'],
    },
  },
  outlined: { control: 'boolean' },
  icon: { control: 'boolean' },
  loading: { control: 'boolean' },
};
