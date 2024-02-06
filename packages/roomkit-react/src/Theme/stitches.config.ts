import type * as Stitches from '@stitches/react';
import { createStitches } from '@stitches/react';
import merge from 'lodash.merge';
import { baseConfig, defaultMedia, defaultThemeMap, defaultUtils } from './base.config';
import { DEFAULT_PORTAL_CONTAINER } from '../Prebuilt/common/constants';

const HmsStitches = createStitches({
  prefix: 'hms-ui',
  theme: {
    ...baseConfig.theme,
    colors: {
      ...baseConfig.theme.colors,
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
  [`${DEFAULT_PORTAL_CONTAINER} *`]: {
    fontFamily: '$sans',
    boxSizing: 'border-box',
  },
  '::-webkit-scrollbar-track': {
    WebkitBoxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: '#657080',
    borderRadius: '5px',
  },
  /**
   * needed for safari. Safari
   * adds background color on its own
   * on hls-viewer on fullscreen
   */
  '#hls-viewer-dark:fullscreen': {
    backgroundColor: 'black !important',
  },

  '#hls-viewer-light:fullscreen': {
    backgroundColor: 'white !important',
  },
});

export type ThemeType = 'default';
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
  themeType: string;
  className?: string;
  theme?: Partial<Theme>;
}) => {
  if (!themeType) {
    throw new Error('Theme type is required');
  }
  const mergedTheme = merge(baseConfig.theme, theme || {});
  return createThemeBase(className || `${themeType}-theme`, mergedTheme);
};

export type CSS = Stitches.CSS<typeof HmsStitches>;
