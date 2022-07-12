import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { setUpFakeStore, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import { HMSThemeProvider } from '../src/Theme';
import { themes } from '@storybook/theming';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  darkMode: {
    // Override the default dark theme
    dark: { ...themes.dark, appBg: '#181818' },
    // Override the default light theme
    light: { ...themes.normal, appBg: 'lightgray' },
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
