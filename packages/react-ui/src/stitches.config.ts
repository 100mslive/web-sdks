import { createStitches } from '@stitches/react';
import type * as Stitches from '@stitches/react';

const HmsStitches = createStitches({
  prefix: 'hms-ui',
  theme: {
    colors: {
      brandTint: '#74AAFF',
      brandMain: '#2F80FF',
      brandShade: '#0B326F',
      redTint: '#E66977',
      redMain: '#D74451',
      redShade: '#6F2229',
      bg: '#000',
      fg: '#FFF',
      grey1: '#212121',
      grey2: '#3B3B3B',
      grey3: '#5E5E5E',
      grey4: '#8E8E8E',
      grey5: '#C7C7C7',
      grey6: '#E3E3E3',
      grey7: '#F2F2F2',
      iconBtn: '#FFF',
      trans: 'rgba(255, 255, 255, 0.25)',
      disabled: 'rgba(196, 196, 196, 0.21)',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    },
    radii: {
      '0': '0.25rem',
      '1': '0.5rem',
      '2': '0.75rem',
      '3': '1rem',
      round: '100rem',
    },
    sizes: {
      '0': '0.5rem',
      '1': '1rem',
      '2': '1.5rem',
      '3': '2rem',
      '4': '2.5rem',
      '5': '3rem',
      '6': '4rem',
      '7': '6rem',
      '8': '8rem',
      header: '3.5rem',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.3125rem',
      xl: '1.75rem',
      '2xl': '2.3125rem',
      '3xl': '3.125rem',
      '4xl': '5.625rem',
    },
    space: {
      '0': '0.125rem',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '2rem',
      '6': '2.5rem',
      '7': '3rem',
      '8': '4rem',
      '9': '5rem',
    },
  },
  utils: {
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
    size: (value: Stitches.ScaleValue<'size'> | number | string) => ({
      height: value,
      width: value,
    }),
    w: (value: Stitches.ScaleValue<'size'> | number | string) => ({
      width: value,
    }),
    h: (value: Stitches.ScaleValue<'size'> | number | string) => ({
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
  },
  media: {
    allowMotion: '(prefers-reduced-motion: no-preference)',
    sm: '(max-width: 640px)',
    md: '(max-width: 768px)',
    lg: '(max-width: 1024px)',
    xl: '(max-width: 1280px)',
    '2xl': '(max-width: 1536px)',
    ls: '(max-width: 1024px) and (orientation: landscape)',
  },
});

export const { theme, createTheme, styled, globalCss, keyframes, getCssText } = HmsStitches;

export const lightTheme = createTheme({
  colors: {
    fg: '#000',
    bg: '#FFF',
    grey7: '#212121',
    grey6: '#3B3B3B',
    grey5: '#5E5E5E',
    grey4: '#8E8E8E',
    grey3: '#C7C7C7',
    grey2: '#E3E3E3',
    grey1: '#F2F2F2',
    iconBtn: '#3B3B3B',
    trans: 'rgba(0, 0, 0, 0.22)',
    disabled: 'rgba(59, 59, 59, 0.13)',
  },
});

export type CSS = Stitches.CSS<typeof HmsStitches>;
