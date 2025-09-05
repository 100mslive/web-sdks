import React, { useState } from 'react';
import { ComponentStory } from '@storybook/react';
import { Button } from '../Button';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Toast } from './Toast';
import ToastDocs from './Toast.mdx';

const ToastStory = ({ ...props }) => {
  return (
    <Toast.Provider>
      <ToastComponent {...props} />
    </Toast.Provider>
  );
};

const ToastMeta = {
  title: 'UI Components/Toast',
  component: ToastStory,
  argTypes: {
    onClick: { action: 'clicked' },
    icon: { control: 'boolean' },
  },
  parameters: {
    docs: {
      page: ToastDocs,
    },
  },
};

const ToastComponent = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</Button>
      <Toast.Root open={isOpen} onOpenChange={o => setIsOpen(o)} {...props}>
        <Toast.Title asChild>
          <Flex align="center" css={{ gap: '4', flex: '1 1 0', minWidth: 0 }}>
            <Text variant="sub1" css={{ c: 'inherit', wordBreak: 'break-word' }}>
              Hello from toast.
            </Text>
            <Toast.Close />
          </Flex>
        </Toast.Title>
        <Toast.Description>
          This is a custom toast component using primitives with controlled open and close state using React state.
        </Toast.Description>
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '24' }} />
    </>
  );
};
export const Example: ComponentStory<typeof ToastStory> = ToastStory.bind({});

Example.storyName = 'Toast';

export default ToastMeta;
