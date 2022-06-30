import React, { ReactNode } from 'react';
import { ComponentMeta } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Text } from '../Text';

export default {
  title: 'UI Components/Tooltip',
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const TooltipStory = args => {
  return (
    <Tooltip {...args}>
      <span>Hover to see Tooltip</span>
    </Tooltip>
  );
};

export const ExampleWithString = TooltipStory.bind({});

ExampleWithString.args = {
  title: 'hi',
};

const TooltipStorywithReactNode = (args: any, title: ReactNode) => {
  return (
    <Tooltip title={<div dangerouslySetInnerHTML={{ _html: title }} />} {...args}>
      <span>Hover to see Tooltip</span>
    </Tooltip>
  );
};

export const ExampleWithReactNode = TooltipStorywithReactNode.bind({});

ExampleWithReactNode.args = {
  title: 'Hello',
};
