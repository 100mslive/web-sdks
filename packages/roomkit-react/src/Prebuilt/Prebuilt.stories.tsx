import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: 'tsj-obqh-lwx' },
    logo: { control: { type: 'object' }, defaultValue: undefined },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', logo, options }) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} options={options} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: 'tsj-obqh-lwx',
  options: {
    endpoints: {
      roomLayout: 'https://demo8271564.mockable.io/v2/layouts/ui'
    }
  }
};
