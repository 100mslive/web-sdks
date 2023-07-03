import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Input } from '../Input';
import { Label } from '../Label';
import { Text } from '../Text';
import { Fieldset } from '.';

export default {
  title: 'UI Components/Fieldset',
  component: Fieldset,
  argTypes: {
    ref: { table: { disable: true } },
    as: { table: { disable: true } },
  },
} as ComponentMeta<typeof Fieldset>;

const Template: ComponentStory<typeof Fieldset> = ({ css }) => {
  return (
    <Fieldset css={css} style={{ width: '70%' }}>
      <Label htmlFor="name">
        <Text variant="sub2">Input Label</Text>
      </Label>
      <Input id="name" placeholder="Some random input" css={{ w: '80%' }} />
    </Fieldset>
  );
};

export const Example = Template.bind({});
Example.storyName = 'Fieldset';
