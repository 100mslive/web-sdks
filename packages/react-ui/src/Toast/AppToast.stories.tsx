import React, { ReactNode, useState } from 'react';
import { RecordIcon } from '@100mslive/react-icons';
import { Toast } from './Toast';
import ToastDocs from './Toast.mdx';
import { Button } from '../Button';
import { Text } from '../Text';

const ToastStory = ({ ...props }) => {
  return (
    <Toast.Provider>
      <ToastComponent {...props} />
    </Toast.Provider>
  );
};
const ReactToastStory = ({ ...props }) => {
  return (
    <Toast.Provider>
      <ReactToastComponent {...props} />
    </Toast.Provider>
  );
};

const ToastMeta = {
  title: 'UI Components/Toast',
  component: ToastStory,
  argTypes: {
    onClick: { action: 'clicked' },
    open: { control: 'boolean' },
    variant: { control: 'select', options: ['danger', 'standard', 'warning', 'success', ''] },
  },
  args: {
    variant: 'standard',
    title: 'Hello from Toast Component',
    description: 'Write Desc here',
    isClosable: true,
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
      <Toast.Root open={true} onOpenChange={o => setIsOpen(o)} {...props}>
        <Toast.Title css={{ mr: '$12' }}>Hello from Toast Component</Toast.Title>
        <Toast.Description css={{ mr: '$12' }}>Toast component Description</Toast.Description>
        <Toast.Close />
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};
const ReactToastComponent = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</Button>
      <Toast.ReactToast
        title={'Toast title goes here'}
        description="Toast description goes here"
        open={true}
        isClosable={true}
        icon={<RecordIcon />}
        cta={
          <Button variant="standard" outlined css={{ w: 'max-content', p: '$4 $8', gap: '8px' }} icon>
            <Text variant="body2" as="div" css={{ fontWeight: '$regular', lineHeight: '0' }}>
              Hello
            </Text>
            <RecordIcon></RecordIcon>
          </Button>
        }
        onOpenChange={o => setIsOpen(o)}
        {...props}
      ></Toast.ReactToast>
      {/* <Toast.Root open={true} onOpenChange={o => setIsOpen(o)} {...props}>
        <Toast.Title css={{ mr: '$12' }}>Hello from Toast Component</Toast.Title>
        <Toast.Description css={{ mr: '$12' }}>Toast component Description</Toast.Description>
        <Toast.Close />
      </Toast.Root>
      <Toast.Viewport css={{ bottom: '$24' }} /> */}
    </>
  );
};

export const Example = ToastStory.bind({});
export const AppToast = ReactToastStory.bind({});
export default ToastMeta;
