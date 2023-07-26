import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: 'tsj-obqh-lwx' },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', logo }) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: 'tsj-obqh-lwx',
};
