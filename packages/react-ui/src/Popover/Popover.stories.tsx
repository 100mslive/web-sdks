import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Popover } from './index';
import PopoverDocs from './Popover.mdx';
import React from 'react';
import { CrossIcon, ExpandIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Tooltip } from '../Tooltip';
import { Text } from '../Text';
import { Label } from '../Label';
import { Input } from '../Input';
import { Inputfield } from '../Inputfield';

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
  <Flex>
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="primary" css={{ aspectRatio: 1, r: '$round' }}>
          <Tooltip title="Leave Room">
            <Box css={{ w: '$10', h: '$10' }}>
              <ExpandIcon></ExpandIcon>
            </Box>
          </Tooltip>
        </Button>
      </Popover.Trigger>
      <Popover.Content sideOffset={5}>
        <Flex css={{ flexDirection: 'column', gap: 10 }} justify="center" align="center">
          <Flex direction="row" justify="between" css={{ width: '100%' }}>
            <Text as="div" variant="overline" css={{ color: '$textMedEmp' }}>
              Dimensions
            </Text>
            <Box css={{ color: '$textMedEmp' }}>
              <CrossIcon width="0.75rem" height="0.75rem"></CrossIcon>
            </Box>
          </Flex>
          <Inputfield css={{ justifyContent: 'between', width: '100%' }}>
            <Label htmlFor="width">
              <Text variant="sub2">Width</Text>
            </Label>
            <Input />
          </Inputfield>
          <Inputfield>
            <Label htmlFor="maxWidth">
              <Text variant="sub2">Max. width</Text>
            </Label>
            <Input />
          </Inputfield>
          <Inputfield>
            <Label htmlFor="height">
              <Text variant="sub2">Height</Text>
            </Label>
            <Input />
          </Inputfield>
          <Inputfield>
            <Label htmlFor="maxHeight">
              <Text variant="sub2">Max. height</Text>
            </Label>
            <Input />
          </Inputfield>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  </Flex>
);
export const Example = Template.bind({});

Example.args = {};
