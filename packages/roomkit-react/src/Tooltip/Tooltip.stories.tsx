import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { alignTooltip, sideTooltip, Tooltip } from './Tooltip';

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
        <Text>Hover to see Tooltip</Text>
      </Tooltip>
    </Flex>
  );
};

export const ExampleWithString = TooltipStoryWithString.bind({});

const ExampleTitle = () => {
  return <h3 style={{ color: 'onPrimary.high' }}>This is title</h3>;
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
        <Text>Hover to see tooltip</Text>
      </Tooltip>
    </Flex>
  );
};

export const ExampleWithReactNode = TooltipStorywithReactNode.bind({});
