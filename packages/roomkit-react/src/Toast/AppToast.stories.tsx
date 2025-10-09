import { useState } from 'react';
import { ComponentStory } from '@storybook/react';
import { Button } from '../Button';
import { Toast } from './Toast';
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

const ReactToastComponent: ComponentStory<typeof ReactToastStory> = args => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</Button>
      <Toast.HMSToast
        title="This is a title"
        description="This is a toast using the HMSToast component."
        open={isOpen}
        isClosable={true}
        onOpenChange={o => setIsOpen(o)}
        {...args}
      />
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};

export const Playground: ComponentStory<typeof ReactToastStory> = ReactToastStory.bind({});
Playground.storyName = 'HMSToast';
export default ToastMeta;
