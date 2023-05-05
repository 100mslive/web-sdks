import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { useDarkMode } from 'storybook-dark-mode';
import { themes } from '@storybook/theming';

import { setUpFakeStore, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import { HMSThemeProvider, ThemeTypes } from '../src/Theme';
import { DecoratorFn } from '@storybook/react';

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

export const decorators: DecoratorFn[] = [
  Story => {
    const isDark = useDarkMode();
    return (
      //@ts-ignore
      <HMSRoomProvider store={storyBookStore} actions={storyBookSDK}>
        <HMSThemeProvider themeType={isDark ? ThemeTypes.dark : ThemeTypes.light}>{Story()}</HMSThemeProvider>
      </HMSRoomProvider>
    );
  },
];
