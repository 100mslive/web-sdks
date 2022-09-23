import React, { useState } from 'react';
import { Toast } from './Toast';
import ToastDocs from './Toast.mdx';
import { Button } from '../Button';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { ComponentStory } from '@storybook/react';

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
        <Toast.Title>
          <Flex align="center" css={{ gap: '$4', flex: '1 1 0', minWidth: 0 }}>
            <Text variant="sub1" css={{ c: 'inherit', wordBreak: 'break-word' }}>
              Hello from toast.
            </Text>
          </Flex>
          <Toast.Close />
        </Toast.Title>
        <Toast.Description>Toast component Description</Toast.Description>
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};
export const Example: ComponentStory<typeof ToastStory> = ToastStory.bind({});

Example.storyName = 'Toast';

export default ToastMeta;
