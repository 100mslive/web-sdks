import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: 'cuf-wywo-trf' },
    logo: { control: { type: 'object' }, defaultValue: undefined },
    typography: { control: { type: 'object' }, defaultValue: 'Roboto' },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({ roomCode = '', logo, themes, typography, options }) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} options={options} themes={themes} typography={typography} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
Example.args = {
  roomCode: 'hwt-diz-gxv',
  options: {
    endpoints: {
      roomLayout: 'https://api-nonprod.100ms.live/v2/layouts/ui',
      init: 'https://qa-init.100ms.live/init',
      tokenByRoomCode: 'https://auth-nonprod.100ms.live/v2/token',
    },
  },
  typography: {
    font_family: 'Roboto',
  },
};
