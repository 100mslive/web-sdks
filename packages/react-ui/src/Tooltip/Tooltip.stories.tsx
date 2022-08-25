import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { alignTooltip, sideTooltip, Tooltip } from './Tooltip';
import { Flex } from '../Layout';

export default {
  title: 'UI Components/Tooltip',
  argTypes: {
    outlined: { control: 'boolean' },
    side: { control: 'radio' },
    align: { control: 'radio' },
  },
  args: {
    outlined: false,
    side: 'bottom',
    align: 'center',
  },
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const TooltipStoryWithString = (
  args: JSX.IntrinsicAttributes & {
    title?: React.ReactNode;
    outlined?: boolean | undefined;
    side?: sideTooltip;
    align?: alignTooltip;
  } & { children?: React.ReactNode },
) => {
  return (
    <Flex justify="center" align="center" css={{ w: 800, h: 200 }}>
      <Tooltip title="This is title" {...args}>
        <span>Hover to see Tooltip</span>
      </Tooltip>
    </Flex>
  );
};

export const ExampleWithString = TooltipStoryWithString.bind({});

const ExampleTitle = () => {
  return <h3 style={{ color: '$textPrimary' }}>This is title</h3>;
};

const TooltipStorywithReactNode = (
  args: JSX.IntrinsicAttributes & {
    title?: React.ReactNode;
    outlined?: boolean | undefined;
    side?: sideTooltip;
    align?: alignTooltip;
  } & { children?: React.ReactNode },
) => {
  return (
    <Flex justify="center" align="center" css={{ w: 800, h: 200 }}>
      <Tooltip title={<ExampleTitle />} {...args}>
        <span>Hover to see Tooltip</span>
      </Tooltip>
    </Flex>
  );
};

export const ExampleWithReactNode = TooltipStorywithReactNode.bind({});
