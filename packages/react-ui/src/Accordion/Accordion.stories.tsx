import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Accordion } from '.';

export default {
  title: 'UI Components/Accordion',
  component: Accordion.Root,
} as ComponentMeta<typeof Accordion.Root>;

const Template = () => {
  return (
    <Accordion.Root type="single" defaultValue="item-1" collapsible css={{ width: '300px' }}>
      <Accordion.Item value="item-1">
        <Accordion.Header css={{ padding: '$8 $9' }}>Is it accessible?</Accordion.Header>
        <Accordion.Content contentStyles={{ padding: '$8 $9' }}>
          Yes. It adheres to the WAI-ARIA design pattern.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-2">
        <Accordion.Header css={{ padding: '$8 $9' }}>Is it unstyled?</Accordion.Header>
        <Accordion.Content contentStyles={{ padding: '$8 $9' }}>
          Yes. It's unstyled by default, giving you freedom over the look and feel.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-3">
        <Accordion.Header css={{ padding: '$8 $9' }}>Can it be animated?</Accordion.Header>
        <Accordion.Content contentStyles={{ padding: '$8 $9' }}>
          Yes! You can animate the Accordion. with CSS or JavaScript.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

export const AccordionContent = Template.bind({});
