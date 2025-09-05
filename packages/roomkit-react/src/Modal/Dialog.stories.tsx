import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CrossIcon, InfoIcon } from '@100mslive/react-icons';
import { Button } from '../Button';
import { Fieldset } from '../Fieldset';
import { Input } from '../Input';
import { Label } from '../Label';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Dialog } from './Dialog';
import DialogDocs from './Dialog.mdx';

export default {
  title: 'UI Components/Dialog',
  component: Dialog.Root,
  argTypes: { onClick: { action: 'clicked' } },
  parameters: {
    docs: {
      page: DialogDocs,
    },
  },
} as ComponentMeta<typeof Dialog.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof Dialog.Root> = () => (
  <Dialog.Root css={{ position: 'relative' }}>
    <Dialog.Trigger asChild>
      <Button variant="standard">Open Dialog</Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Title css={{ c: 'onSurface.high', position: 'relative' }}>
          <Flex direction="row" justify="between" css={{ w: '100%' }}>
            <Flex justify="start" align="center" gap="3">
              <InfoIcon />
              <Text variant="h5">Dialog Heading</Text>
            </Flex>
            <Dialog.DefaultClose css={{ position: 'absolute', top: '-1rem', right: '-1rem' }}>
              <CrossIcon />
            </Dialog.DefaultClose>
          </Flex>
        </Dialog.Title>
        <Text variant="body1" css={{ c: 'onSurface.medium' }}>
          Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
        </Text>
        <Fieldset css={{ mt: '4' }}>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Hardik" css={{ w: '50%' }} />
        </Fieldset>
        <Fieldset>
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="@hdz666" css={{ w: '50%' }} />
        </Fieldset>
        <Flex css={{ marginTop: 25, justifyContent: 'flex-end' }}>
          <Dialog.Close asChild>
            <Button variant="primary">Save changes</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export const Example = Template.bind({});
Example.storyName = 'Dialog';
