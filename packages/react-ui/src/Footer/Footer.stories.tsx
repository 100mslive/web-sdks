import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Footer } from '.';

export default {
  title: 'UI Components/Footer',
  component: Footer.Root,
  argTypes: {
    as: { table: { disable: true } },
    css: { control: { type: 'object' } },
  },
} as ComponentMeta<typeof Footer.Root>;

const Template: ComponentStory<typeof Footer.Root> = ({ css }) => {
  return (
    <Footer.Root css={css}>
        <Footer.Left>This is the left side of the footer</Footer.Left>
        <Footer.Center>This is the center of the footer</Footer.Center>
        <Footer.Right>This is the right side of the footer</Footer.Right>
    </Footer.Root>
  );
};

export const Example = Template.bind({});
