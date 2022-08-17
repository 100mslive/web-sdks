import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { PasswordInput } from './Input';
import { Box } from '../Layout';

export default {
  title: 'UI Components/PasswordInput',
  component: PasswordInput.Root,
  /*  args: {
    copyIconStyle: {},
    passwordIconStyle: {},
  },
  argTypes: {
    onChange: { action: 'clicked' },
    onCopy: { action: 'clicked' },
    hasPassword: { control: 'boolean' },
    hasCopy: { control: 'boolean' },
    loading: { control: 'boolean' },
    css: { control: 'object' },
    copyIconStyle: { control: 'object' },
    passwordIconStyle: { control: 'object' },
  },*/
} as ComponentMeta<typeof PasswordInput.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof PasswordInput.Root> = args => {
  const [text, setText] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <Box css={{ w: '240px' }}>
      <PasswordInput.Root {...args}>
        <PasswordInput.Input showPassword={showPassword} onChange={e => setText(e.target.value)} />
        <PasswordInput.Icons>
          <PasswordInput.ShowIcon
            showPassword={showPassword}
            onClick={() => {
              setShowPassword(!showPassword);
            }}
          />
          <PasswordInput.CopyIcon
            onClick={() => {
              navigator.clipboard.writeText(text);
            }}
          />
        </PasswordInput.Icons>
      </PasswordInput.Root>
    </Box>
  );
};

export const Example = Template.bind({});
