import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CrossIcon, InfoIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Fieldset } from '../Fieldset';
import { Input } from '../Input';
import { Label } from '../Label';
import { Flex } from '../Layout';
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
      <Sheet.Title>
        <Flex direction="row" justify="between" css={{ w: '100%' }}>
          <Flex justify="start" align="center" gap="3">
            <InfoIcon />
            <Text variant="h5">Sheet Heading</Text>
          </Flex>
          <Sheet.Close>
            <CrossIcon />
          </Sheet.Close>
        </Flex>
      </Sheet.Title>
      <Text variant="body1" css={{ c: '$on_surface_medium' }}>
        Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
        dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
      </Text>
      <Fieldset>
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Hardik" css={{ w: '50%' }} />
      </Fieldset>
      <Fieldset>
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@hdz666" css={{ w: '50%' }} />
      </Fieldset>
    </Sheet.Content>
  </Sheet.Root>
);

export const Example = Template.bind({});
Example.storyName = 'Sheet';
