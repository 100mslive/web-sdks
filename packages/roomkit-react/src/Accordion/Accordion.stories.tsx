import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Accordion } from '.';

export default {
  title: 'UI Components/Accordion',
  component: Accordion.Root,
} as ComponentMeta<typeof Accordion.Root>;

function AccordionItem({ value, header, content }: { value: string; header: string; content: string }) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header css={{ padding: '$8 $9' }}>{header}</Accordion.Header>
      <Accordion.Content contentStyles={{ padding: '$8 $9' }}>
        <>
          {content}
          <Accordion.Item value={value + '1'}>
            <Accordion.Header css={{ padding: '$8 $9' }}>nested header</Accordion.Header>
            <Accordion.Content contentStyles={{ padding: '$8 $9' }}>nested item</Accordion.Content>
          </Accordion.Item>
        </>
      </Accordion.Content>
    </Accordion.Item>
  );
}

const Template = () => {
  return (
    <Accordion.Root type="multiple" defaultValue={['item-1']} css={{ width: '300px' }}>
      <AccordionItem
        value="item-1"
        header="Is it accessible?"
        content="Yes. It adheres to the WAI-ARIA design pattern."
      />
      <AccordionItem
        value="item-2"
        header="Is it unstyled?"
        content="Yes. It's unstyled by default, giving you freedom over the look and feel."
      />
      <AccordionItem
        value="item-3"
        header="Can it be animated?"
        content="Yes! You can animate the Accordion. with CSS or JavaScript."
      />
    </Accordion.Root>
  );
};

export const AccordionContent: ComponentStory<typeof Accordion.Root> = Template.bind({});
AccordionContent.storyName = 'Accordion';
