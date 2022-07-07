import React, { useState } from 'react';
import { RecordIcon } from '@100mslive/react-icons';
import { Toast } from './Toast';
import ToastDocs from './Toast.mdx';
import { Button } from '../Button';
import { Text } from '../Text';

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
      page: ToastDocs,
    },
  },
};

const ReactToastComponent = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Launch'} Toast</Button>
      <Toast.DefaultToast
        title={'Toast title goes here'}
        description="Toast description goes here"
        open={true}
        isClosable={true}
        icon={<RecordIcon />}
        action={
          <Button variant="standard" outlined css={{ w: 'max-content', p: '$4 $8', gap: '8px' }} icon>
            <Text variant="body2" as="div" css={{ fontWeight: '$regular', lineHeight: '0' }}>
              Hello
            </Text>
            <RecordIcon></RecordIcon>
          </Button>
        }
        onOpenChange={o => setIsOpen(o)}
        {...props}
      ></Toast.DefaultToast>
      <Toast.Viewport css={{ bottom: '$24' }} />
    </>
  );
};

export const AppToast = ReactToastStory.bind({});
export default ToastMeta;
