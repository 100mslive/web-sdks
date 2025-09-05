import React, { useEffect, useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CheckIcon } from '@100mslive/react-icons';
import { Label } from '../Label';
import { Flex } from '../Layout';
import { Checkbox } from '.';

export default {
  title: 'UI Components/Checkbox',
  component: CheckboxWithLabelComponent,
  argTypes: {
    onCheckedChange: { action: { type: 'clicked' } },
    checked: { control: { type: 'boolean' } },
    label: { control: { type: 'text' } },
    css: { control: { type: 'object' } },
  },
  args: {
    checked: true,
    label: 'Label',
  },
} as ComponentMeta<typeof CheckboxWithLabelComponent>;

type CheckboxWithLabelComponentProps = {
  label?: string;
  checked?: boolean;
} & React.ComponentProps<typeof Checkbox.Root>;

function CheckboxWithLabelComponent({ label, checked = true, css, onCheckedChange }: CheckboxWithLabelComponentProps) {
  const [internalChecked, setInternalChecked] = useState(checked);

  useEffect(() => {
    handleOnCheckedChange(checked);
  }, [checked]); //eslint-disable-line

  function handleOnCheckedChange(checked: boolean) {
    setInternalChecked(checked);
    if (onCheckedChange) {
      onCheckedChange(checked);
    }
  }

  return (
    <Flex align="center">
      <Checkbox.Root id={label} checked={internalChecked} css={css} onCheckedChange={handleOnCheckedChange}>
        <Checkbox.Indicator css={{ display: 'flex' }}>
          <CheckIcon width={16} height={16} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Label htmlFor={label} css={{ ml: '4', fontSize: 'sm', cursor: 'pointer' }}>
        {label}
      </Label>
    </Flex>
  );
}

const CheckboxWithLabelStory: ComponentStory<typeof CheckboxWithLabelComponent> = args => {
  return <CheckboxWithLabelComponent {...args} />;
};

export const Example = CheckboxWithLabelStory.bind({});
Example.storyName = 'Checkbox';
