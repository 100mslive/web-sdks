import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: 'wxx-rjvk-sgb' },
    logo: { control: { type: 'object' }, defaultValue: undefined },
    typography: { control: { type: 'object' }, defaultValue: 'Roboto' },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', logo, themes, typography, options }) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} options={options} themes={themes} typography={typography} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: process.env.SAMPLE_ROOM_CODE || '',
  options: {
    endpoints: {
      roomLayout: process.env.ROOM_LAYOUT_ENDPOINT || '',
      tokenByRoomCode: process.env.TOKEN_BY_ROOM_CODE_ENDPOINT || '',
      init: process.env.INIT_API_ENDPOINT || '',
    },
  },
  typography: {
    font_family: 'Roboto',
  },
};
