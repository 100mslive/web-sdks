import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Toast } from './Toast';

export default {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'UI Components/Toast',
  component: Toast,
} as ComponentMeta<typeof Toast>;

interface ToastProps {
  title: string;
  description: string;
  close: boolean;
  open: boolean;
  duration: number;
  onOpenChange: () => void;
}

const ToastStory: React.FC<ToastProps> = ({ title, description, close = true, open, duration, onOpenChange }) => {
  return (
    <Toast.Provider>
      <Toast.Root open={open} onOpenChange={onOpenChange} duration={!close ? 600000 : duration}>
        <Toast.Title css={{ mr: close ? '$12' : 0 }}>{title}</Toast.Title>
        {description && <Toast.Description css={{ mr: close ? '$12' : 0 }}>{description}</Toast.Description>}
        {close && <Toast.Close />}
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </Toast.Provider>
  );
};

export const Example = ToastStory.bind({});

Example.args = {
  title: 'Hello from Toast Component',
  description: 'Toast component Description',
  open: true,
  close: true,
};
