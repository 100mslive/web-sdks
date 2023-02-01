import type * as Stitches from '@stitches/react';
import { createStitches } from '@stitches/react';
import merge from 'lodash.merge';
import { baseConfig, defaultMedia, defaultThemeMap, defaultUtils } from './base.config';
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

export const {
  theme,
  createTheme: createThemeBase,
  styled,
  globalCss,
  keyframes,
  css,
  getCssText,
  config,
} = HmsStitches;

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
export const createTheme = ({
  themeType,
  theme,
  className,
}: {
  themeType: ThemeType;
  className?: string;
  theme?: Partial<Theme>;
}) => {
  if (!themeType) {
    throw new Error('Theme type is required');
  }
  return createThemeBase(
    className || `${themeType}-theme`,
    merge(baseConfig.theme, themeType === 'dark' ? darkTheme : lightTheme, theme || {}),
  );
};

export type CSS = Stitches.CSS<typeof HmsStitches>;
