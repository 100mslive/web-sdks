import { createStitches } from '@stitches/react';
import type * as Stitches from '@stitches/react';
import { baseConfig, defaultMedia, defaultThemeMap, defaultUtils } from './base.config';
import deepMerge from '../utils/deep-merge';
import { darkTheme, lightTheme } from './themes';

const HmsStitches = createStitches({
  prefix: 'hms-ui',
  theme: {
    ...baseConfig.theme,
    colors: {
      ...baseConfig.theme.colors,
      ...darkTheme.colors,
    },
  },
  media: defaultMedia,
  utils: defaultUtils,
  themeMap: defaultThemeMap,
});

export const { theme, createTheme: createThemeBase, styled, globalCss, keyframes, getCssText } = HmsStitches;

export const globalStyles = globalCss({
  '*': {
    fontFamily: '$sans',
  },
});

export type ThemeType = 'light' | 'dark';
export type Theme = typeof HmsStitches.theme;

/**
 * This method will be used to create custom themes or update any theme values
 * @param { type: ThemeType; className: string; theme: Theme }
 * @returns
 */
export const createTheme = ({ type, theme, className }: { type: ThemeType; className: string; theme: Theme }) => {
  if (!type) {
    throw new Error('Theme type is required');
  }
  return createThemeBase(className || `${type}-theme`, deepMerge(type === 'dark' ? darkTheme : lightTheme, theme));
};

export type CSS = Stitches.CSS<typeof HmsStitches>;
