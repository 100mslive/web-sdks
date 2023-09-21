import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { HMSPrebuilt, HMSPrebuiltOptions, HMSPrebuiltProps } from '.';

export default {
  title: 'UI Components/Prebuilt',
  component: HMSPrebuilt,
  argTypes: {
    roomCode: { control: { type: 'text' }, defaultValue: '' },
    logo: { control: { type: 'object' }, defaultValue: null },
    typography: { control: { type: 'object' }, defaultValue: 'Roboto' },
    options: { control: { type: 'object' }, defaultValue: {} },
  },
} as Meta<typeof HMSPrebuilt>;

const PrebuiltRoomCodeStory: StoryFn<typeof HMSPrebuilt> = ({
  roomCode = '',
  logo,
  themes,
  typography,
  options,
}: HMSPrebuiltProps) => {
  return <HMSPrebuilt roomCode={roomCode} logo={logo} options={options} themes={themes} typography={typography} />;
};

export const Example = PrebuiltRoomCodeStory.bind({});
const endpoints: HMSPrebuiltOptions['endpoints'] = {
  roomLayout: process.env.STORYBOOK_ROOM_LAYOUT_ENDPOINT,
  tokenByRoomCode: process.env.STORYBOOK_TOKEN_BY_ROOM_CODE_ENDPOINT,
  init: process.env.STORYBOOK_INIT_API_ENDPOINT,
};

const hasEndpoints = Object.values(endpoints).some(val => !!val);

Example.args = {
  roomCode: process.env.STORYBOOK_SAMPLE_ROOM_CODE,
  options: {
    userName: '',
    userId: '',
    endpoints: hasEndpoints ? endpoints : undefined,
  },
  typography: {
    font_family: 'Roboto',
  },
};
