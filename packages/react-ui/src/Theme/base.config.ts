import { defaultThemeMap as defaultStitchesThemeMap } from '@stitches/react';
import type * as Stitches from '@stitches/react';

export const baseConfig = {
  theme: {
    colors: {
      white: '#ffffff',
      black: '#000000',
      transparent: 'rgba(0, 0, 0, 0)',
      orange: '#F69133',
      yellow: '#FAC919',
      green: '#38EA9F',
      purple: '#6554C0',
      borderDefault: 'rgba(255, 255, 255, 0.12)',
      borderLight: 'rgba(255, 255, 255, 0.24)',
      success: '#36B37E',
      error: '#ED4C5A',
      errorTint: 'rgba(237,76, 90, 0.9)',
      warning: '#FFAB00',
      brandLight: '#74AAFF',
      brandDefault: '#2F80FF',
      brandDark: '#0B326F',
      brandDisabled: '#D8E7FF',
      grayLight: '#B0C3DB',
      grayDefault: '#657080',
      grayDark: '#303740',
      grayDisabled: '#DCE4EF',
      menuBg: '$grayDark',
      hoverBg: 'rgba(255, 255, 255, 0.25)',
    },
    shadows: {
      sm: '0 0 4px 0 rgba(0,0,0,0.3)',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    },
    fontSizes: {
      h1: '6rem',
      h2: '3.75rem',
      h3: '3rem',
      h4: '2.125rem',
      h5: '1.5rem',
      h6: '1.25rem',
      tiny: '0.625rem',
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
    },
    fontWeights: {
      semiBold: 600,
      medium: 500,
      regular: 400,
    },
    lineHeights: {
      h1: '5.75rem',
      h2: '3.5rem',
      h3: '3.25rem',
      h4: '2.5rem',
      h5: '2rem',
      h6: '1.5rem',
      tiny: '1rem',
      xs: '1rem',
      sm: '1.25rem',
      md: '1.5rem',
    },
    radii: {
      '0': '0.25rem',
      '1': '0.5rem',
      '2': '0.75rem',
      '3': '1rem',
      round: '100rem',
    },
    space: {
      0: '0rem',
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '2.25rem',
      px: '1px',
      1: '0.125rem',
      2: '0.25rem',
      3: '0.375rem',
      4: '0.5rem',
      5: '0.625rem',
      6: '0.75rem',
      7: '0.875rem',
      8: '1rem',
      9: '1.25rem',
      10: '1.5rem',
      11: '1.75rem',
      12: '2rem',
      13: '2.25rem',
      14: '2.5rem',
      15: '2.75rem',
      16: '3rem',
      17: '3.5rem',
      18: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
    borderWidths: {
      light: '1px',
      normal: '2px',
      bold: '3px',
      extrabold: '4px',
      black: '5px',
    },
  },
};

export const defaultUtils = {
  bg: (value: Stitches.PropertyValue<'backgroundColor'>) => ({
    backgroundColor: value,
  }),
  c: (value: Stitches.PropertyValue<'color'>) => ({
    color: value,
  }),
  r: (value: Stitches.ScaleValue<'radii'>) => ({
    borderRadius: value,
  }),
  fs: (value: Stitches.PropertyValue<'fontSize'> | number | string) => ({
    fontSize: value,
  }),
  size: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    height: value,
    width: value,
  }),
  w: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    width: value,
  }),
  h: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    height: value,
  }),
  p: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    padding: value,
  }),
  pt: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingTop: value,
  }),
  pr: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingRight: value,
  }),
  pb: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingBottom: value,
  }),
  pl: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingLeft: value,
  }),
  px: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingLeft: value,
    paddingRight: value,
  }),
  py: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    paddingTop: value,
    paddingBottom: value,
  }),
  m: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    margin: value,
  }),
  mt: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginTop: value,
  }),
  mr: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginRight: value,
  }),
  mb: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginBottom: value,
  }),
  ml: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginLeft: value,
  }),
  mx: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginLeft: value,
    marginRight: value,
  }),
  my: (value: Stitches.ScaleValue<'space'> | number | string) => ({
    marginTop: value,
    marginBottom: value,
  }),
};

export const defaultMedia = {
  allowMotion: '(prefers-reduced-motion: no-preference)',
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
  '2xl': '(max-width: 1536px)',
  ls: '(max-width: 1024px) and (orientation: landscape)',
};

export const defaultThemeMap = {
  ...defaultStitchesThemeMap,
  width: 'space',
  height: 'space',
  minWidth: 'space',
  maxWidth: 'space',
  minHeight: 'space',
  maxHeight: 'space',
  flexBasis: 'space',
  gridTemplateColumns: 'space',
  gridTemplateRows: 'space',
  blockSize: 'space',
  minBlockSize: 'space',
  maxBlockSize: 'space',
  inlineSize: 'space',
  minInlineSize: 'space',
  maxInlineSize: 'space',
};
