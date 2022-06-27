import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Tooltip } from './Tooltip';

export default {
  title: 'UI Components/Tooltip',
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const TooltipStory = () => {
  return (
    <Tooltip title="Tooltip Text">
      <span>Hover to see Tooltip</span>
    </Tooltip>
  );
};

export const Example = TooltipStory.bind({});
