import React from 'react';
import { HMSRoomProvider, HMSActions } from '@100mslive/react-sdk';
import { useDarkMode } from 'storybook-dark-mode';
import { themes } from '@storybook/theming';

import { setUpFakeStore, storyBookNotifications, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import { HMSThemeProvider, ThemeTypes } from '../src/Theme';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    expanded: true,
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
  Story => {
    return (
      <HMSRoomProvider
        store={storyBookStore}
        actions={storyBookSDK as unknown as HMSActions}
        notifications={storyBookNotifications}
      >
        <HMSThemeProvider themeType={useDarkMode() ? ThemeTypes.dark : ThemeTypes.light}>
          <Story />
        </HMSThemeProvider>
      </HMSRoomProvider>
    );
  },
];
