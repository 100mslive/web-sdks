import React from 'react';
import { themes } from '@storybook/theming';
import { setUpFakeStore } from '../src/store/SetupFakeStore';
import {DecoratorFn} from '@storybook/react';

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
    return (
      <Story />
    );
  },
];
