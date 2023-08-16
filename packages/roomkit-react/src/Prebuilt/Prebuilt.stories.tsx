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
    options: { control: { type: 'object' }, defaultValue: {} },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', logo, themes, typography, options }) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} options={options} themes={themes} typography={typography} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: 'wxx-rjvk-sgb',
  options: {
    endpoints: {
      roomLayout: 'https://api-nonprod.100ms.live/v2/layouts/ui',
      tokenByRoomCode: 'https://auth-nonprod.100ms.live/v2/token',
      initEndpoint: 'https://qa-init.100ms.live/init',
    },
  },
  typography: {
    font_family: 'Roboto',
  },
};
