import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Dialog } from './Dialog';
import DialogDocs from './Dialog.mdx';
import React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Inputfield } from '../Inputfield';
import { Text } from '../Text';
import { IconButton } from '../IconButton';
import { Flex } from '../Layout';
import { CrossIcon, InfoIcon } from '@100mslive/react-icons';
import { relative } from 'path';

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
const Template: ComponentStory<typeof Dialog.Root> = args => (
  <Dialog.Root css={{ position: 'relative' }}>
    <Dialog.Trigger asChild>
      <Button variant="standard">Open Dialog</Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Title css={{ c: '$textHighEmp', position: 'relative' }}>
        <Flex direction="row" justify="between" css={{ w: '100%' }}>
          <Flex justify="start" align="center" gap="3">
            <InfoIcon></InfoIcon>
            <Text variant="h5">Dialog Heading</Text>
          </Flex>
          <Dialog.DefaultClose css={{ position: 'absolute', top: '-1rem', right: '-1rem' }}>
            <CrossIcon></CrossIcon>
          </Dialog.DefaultClose>
        </Flex>
      </Dialog.Title>
      <Text variant="body1" css={{ c: '$textMedEmp' }}>
        Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
        dolore magna aliqua. Ut enim ad minim veniam,im venitetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam,im veni
      </Text>
      <Inputfield css={{ mt: '$4' }}>
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Hardik" css={{ w: '50%' }} />
      </Inputfield>
      <Inputfield>
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@hdz666" css={{ w: '50%' }} />
      </Inputfield>
      <Flex css={{ marginTop: 25, justifyContent: 'flex-end' }}>
        <Dialog.Close asChild>
          <Button variant="primary">Save changes</Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
);

export const Example = Template.bind({});
