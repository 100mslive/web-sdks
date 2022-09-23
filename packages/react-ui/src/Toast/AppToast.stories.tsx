import React, { useState } from 'react';

import { Toast } from './Toast';
import { Button } from '../Button';
import mdx from './Toast.mdx';

const ReactToastStory = ({ ...props }) => {
  return (
    <Toast.Provider>
      <ReactToastComponent {...props} />
    </Toast.Provider>
  );
};

const ToastMeta = {
  title: 'UI Components/Toast',
  component: ReactToastStory,
  argTypes: {
    onClick: { action: 'clicked' },
    open: { control: 'boolean' },
    variant: { control: 'select', options: ['error', 'standard', 'warning', 'success', ''] },
  },
  args: {
    variant: 'standard',
    title: 'Hello from Toast Component',
    description: 'Hello from toast',
    isClosable: true,
  },
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

const ReactToastComponent = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</Button>
      <Toast.HMSToast
        title="This is a title"
        description="Toast description goes here"
        open={true}
        isClosable={true}
        onOpenChange={o => setIsOpen(o)}
        {...props}
      />
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};

export const Playground = ReactToastStory.bind({});
export default ToastMeta;
