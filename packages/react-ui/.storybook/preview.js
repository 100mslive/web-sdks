import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { setUpFakeStore, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import { HMSThemeProvider } from '../src/Theme';

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
      <HMSThemeProvider type="dark">
        <Story />
      </HMSThemeProvider>
    </HMSRoomProvider>
  ),
];
