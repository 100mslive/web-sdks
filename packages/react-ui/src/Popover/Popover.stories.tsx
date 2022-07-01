import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Popover } from './index';
import PopoverDocs from './Popover.mdx';
import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Box } from '../Layout';
import { Tooltip } from '../Tooltip';

export default {
  title: 'UI Components/Popover',
  component: Popover.Root,
  argTypes: { onClick: { action: 'clicked' } },
  args: {
    css: {},
  },
  parameters: {
    docs: {
      page: PopoverDocs,
    },
  },
} as ComponentMeta<typeof Popover.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Popover.Root> = args => (
  <Popover.Root>
    <Popover.Trigger asChild>
      <Button variant="danger" css={{ aspectRatio: 1, r: '$round' }}>
        <Tooltip title="Leave Room">
          <Box css={{ w: '$10', h: '$10' }}>
            <CrossIcon key="hangUp" />
          </Box>
        </Tooltip>
      </Button>
    </Popover.Trigger>
    <Popover.Content sideOffset={10}>
      <Button variant="standard" css={{ w: '100%' }}>
        End Room
      </Button>
      <Button variant="danger" css={{ mt: '$4' }}>
        Just Leave
      </Button>
    </Popover.Content>
  </Popover.Root>
);
export const Example = Template.bind({});

Example.args = {};
