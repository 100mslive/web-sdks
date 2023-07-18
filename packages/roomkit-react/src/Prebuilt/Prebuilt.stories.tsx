import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: 'tsj-obqh-lwx' },
    roomId: { control: { type: 'text' }, defaultValue: '' },
    role: { control: { type: 'text' }, defaultValue: '' },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '' }) => {
  return <HMSPrebuilt roomCode={roomCode} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: 'tsj-obqh-lwx',
};
