import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {},
} as Meta<typeof HMSPrebuilt>;

const Template: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', ...rest }) => {
  return <HMSPrebuilt roomCode="alp-gya-cre" />;
};

export const Example = Template.bind({});
Example.storyName = 'Prebuilt';
