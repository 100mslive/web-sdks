import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Link } from '.';

export default {
  title: 'UI Components/Link',
  component: Link,
  parameters: {},
} as ComponentMeta<typeof Link>;

const Template: ComponentStory<typeof Link> = props => {
  return (
    <Link iconSide='left' color="highEmp" href="#" target="_blank">
      Link Text
    </Link>
  );
};

export const Multiple = Template.bind({});
