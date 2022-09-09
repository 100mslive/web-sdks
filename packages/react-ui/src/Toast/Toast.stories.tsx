import React, { useState } from 'react';
import { Toast } from './Toast';
import ToastDocs from './Toast.mdx';
import { Button } from '../Button';

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
  args: {
    variant: 'standard',
    title: 'Hello from Toast Component',
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
        <Toast.Title css={{ mr: '$12' }}>Hello from Toast Component</Toast.Title>
        <Toast.Description css={{ mr: '$12' }}>Toast component Description</Toast.Description>
        <Toast.Close />
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};
export const Example = ToastStory.bind({});

export default ToastMeta;
