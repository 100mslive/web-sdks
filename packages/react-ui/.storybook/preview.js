import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { useDarkMode } from 'storybook-dark-mode'
import { themes } from '@storybook/theming';

import { setUpFakeStore, storyBookSDK, storyBookStore } from '../src/store/SetupFakeStore';
import { HMSThemeProvider } from '../src/Theme';
import { shadeColor } from '../../../apps/100ms-web/src/common/utils';

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
  (Story) => {
    const themeConfig = {
      font: 'Roboto',
      color: '#2F80FF',
    };

    return (
      <HMSRoomProvider store={storyBookStore} actions={storyBookSDK}>
        <HMSThemeProvider
          type={useDarkMode() ? 'dark' : 'light'}
          theme={{
            colors: {
              brandDefault: themeConfig.color,
              brandDark: shadeColor(themeConfig.color, -30),
              brandLight: shadeColor(themeConfig.color, 30),
              brandDisabled: shadeColor(themeConfig.color, 10),
            },
            fonts: {
              sans: [themeConfig.font, 'Inter', 'sans-serif'],
            },
          }}
        >
          <Story />
        </HMSThemeProvider>
      </HMSRoomProvider>
    );
  },
];
