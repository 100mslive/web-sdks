import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CrossIcon, InfoIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { HorizontalDivider } from '../Divider';
import { Fieldset } from '../Fieldset';
import { Input } from '../Input';
import { Label } from '../Label';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { Sheet } from './Sheet';
import SheetDocs from './Sheet.mdx';

export default {
  title: 'UI Components/Sheet',
  component: Sheet.Root,
  argTypes: { onClick: { action: 'clicked' } },
  parameters: {
    docs: {
      page: SheetDocs,
    },
  },
} as ComponentMeta<typeof Sheet.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Sheet.Root> = () => (
  <Sheet.Root>
    <Sheet.Trigger asChild>
      <Button variant="standard">Open Sheet</Button>
    </Sheet.Trigger>
    <Sheet.Content>
      <Sheet.Title css={{ p: '10' }}>
        <Flex direction="row" justify="between" css={{ w: '100%' }}>
          <Flex justify="start" align="center" gap="3">
            <InfoIcon />
            <Text variant="h5">Sheet Heading</Text>
          </Flex>
          <Sheet.Close css={{ color: 'white' }}>
            <CrossIcon />
          </Sheet.Close>
        </Flex>
      </Sheet.Title>
      <HorizontalDivider />
      <Box as="div" css={{ p: '10', overflowY: 'scroll', maxHeight: '70vh' }}>
        <Text variant="body1" css={{ c: 'onSurface.medium' }}>
          Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
        </Text>
        <Fieldset>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Amar" css={{ w: '50%' }} />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@amar1995" css={{ w: '50%' }} />
        </Fieldset>
        <Text variant="body1" css={{ c: 'onSurface.medium' }}>
          Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
        </Text>
        <Fieldset>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Amar" css={{ w: '50%' }} />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@amar1995" css={{ w: '50%' }} />
        </Fieldset>
        <Text variant="body1" css={{ c: 'onSurface.medium' }}>
          Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
        </Text>
        <Fieldset>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Amar" css={{ w: '50%' }} />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@amar1995" css={{ w: '50%' }} />
        </Fieldset>
        <Text variant="body1" css={{ c: 'onSurface.medium' }}>
          Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
        </Text>
        <Fieldset>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Amar" css={{ w: '50%' }} />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@amar1995" css={{ w: '50%' }} />
        </Fieldset>
      </Box>
    </Sheet.Content>
  </Sheet.Root>
);

export const Example = Template.bind({});
Example.storyName = 'Sheet';
