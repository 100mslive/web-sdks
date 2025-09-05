import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CrossIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Fieldset } from '../Fieldset';
import { Input } from '../Input';
import { Label } from '../Label';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { Popover } from './index';
import PopoverDocs from './Popover.mdx';

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
const Template: ComponentStory<typeof Popover.Root> = () => (
  <Flex css={{ w: '80' }} justify="center">
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          variant="standard"
          css={{
            aspectRatio: '1',
            r: 'round',
            p: '$2 $2',
            bg: 'background.default',
            '&:hover': { bg: 'background.dim !important' },
          }}
        >
          <Box css={{ w: '10', h: '10', c: 'onPrimary.high' }}>
            <VerticalMenuIcon />
          </Box>
        </Button>
      </Popover.Trigger>
      <Popover.Content align="center" side="bottom" sideOffset={10}>
        <Flex css={{ flexDirection: 'column', gap: 10 }} justify="center" align="center">
          <Flex direction="row" justify="between" css={{ width: '100%' }}>
            <Text as="div" variant="caption" css={{ color: 'onSurface.medium' }}>
              Dimensions
            </Text>
            <Box css={{ color: 'onSurface.medium' }}>
              <CrossIcon width="0.75rem" height="0.75rem" />
            </Box>
          </Flex>
          <Fieldset css={{ justifyContent: 'between', width: '100%' }}>
            <Label htmlFor="width" asChild>
              <Text as="span" variant="sub2">
                Width
              </Text>
            </Label>
            <Input />
          </Fieldset>
          <Fieldset css={{ justifyContent: 'between', width: '100%' }}>
            <Label htmlFor="maxWidth" asChild>
              <Text as="span" variant="sub2">
                Max. width
              </Text>
            </Label>
            <Input />
          </Fieldset>
          <Fieldset css={{ justifyContent: 'between', width: '100%' }}>
            <Label htmlFor="height" asChild>
              <Text as="span" variant="sub2">
                Height
              </Text>
            </Label>
            <Input />
          </Fieldset>
          <Fieldset css={{ justifyContent: 'between', width: '100%' }}>
            <Label htmlFor="maxHeight" asChild>
              <Text as="span" variant="sub2">
                Max. height
              </Text>
            </Label>
            <Input />
          </Fieldset>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  </Flex>
);
export const Example = Template.bind({});
Example.storyName = 'Popover';
