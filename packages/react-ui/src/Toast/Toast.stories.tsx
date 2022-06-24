import React, { useState } from 'react';
import { Toast } from './Toast';

const ToastStory = () => {
  return (
    <Toast.Provider>
      <ToastComponent />
    </Toast.Provider>
  );
};

const ToastComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</button>
      <Toast.Root open={isOpen} duration={60000}>
        <Toast.Title css={{ mr: '$12' }}>Hello from Toast Component</Toast.Title>
        <Toast.Description css={{ mr: '$12' }}>Toast component Description</Toast.Description>
        <Toast.Close />
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};

export const Example = ToastStory.bind({});

const ToastMeta = {
  title: 'UI Components/Toast',
  component: ToastStory,
};

export default ToastMeta;
