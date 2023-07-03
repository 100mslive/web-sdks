import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Link } from '.';

export default {
  title: 'UI Components/Link',
  component: Link,
} as ComponentMeta<typeof Link>;

const Template: ComponentStory<typeof Link> = props => {
  return (
    <Link icon={props.icon} iconSide={props.iconSide} color={props.color} href="#">
      Link Text
    </Link>
  );
};

export const Multiple = Template.bind({});
