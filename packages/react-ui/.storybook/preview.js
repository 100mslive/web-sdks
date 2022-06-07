import { HMSRoomProvider } from '@100mslive/react-sdk';
import { setUpFakeStore, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import React from 'react';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

setUpFakeStore();

export const decorators = [
  Story => (
    <HMSRoomProvider store={storyBookStore} actions={storyBookSDK}>
      <Story />
    </HMSRoomProvider>
  ),
];
