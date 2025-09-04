import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // CSS output
  outdir: 'src/styled-system',

  // Include paths
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // Exclude paths
  exclude: [],

  // Theme configuration matching Stitches base config
  theme: {
    tokens: {
      colors: {
        primary: {
          default: { value: '#2572ED' },
          bright: { value: '#538DFF' },
          dim: { value: '#002D6D' },
          disabled: { value: '#004299' },
        },
        onPrimary: {
          high: { value: 'rgba(245, 249, 255, 0.95)' },
          medium: { value: 'rgba(224, 236, 255, 0.8)' },
          low: { value: 'rgba(194, 208, 229, 0.5)' },
        },
        secondary: {
          default: { value: '#444954' },
          bright: { value: '#70778B' },
          dim: { value: '#293042' },
          disabled: { value: '#404759' },
        },
        onSecondary: {
          high: { value: '#FFFFFF' },
          medium: { value: '#D3D9F0' },
          low: { value: '#A4ABC0' },
        },
        background: {
          default: { value: '#0B0E15' },
          dim: { value: '#000000' },
        },
        surface: {
          default: { value: '#191B23' },
          bright: { value: '#272A31' },
          brighter: { value: '#2E3038' },
          dim: { value: '#11131A' },
        },
        onSurface: {
          high: { value: '#EFF0FA' },
          medium: { value: '#C5C6D0' },
          low: { value: '#8F9099' },
        },
        border: {
          default: { value: '#1D1F27' },
          bright: { value: '#272A31' },
        },
        alert: {
          success: { value: '#36B37E' },
          warning: { value: '#FFAB00' },
          error: {
            default: { value: '#C74E5B' },
            bright: { value: '#FFB2B6' },
            brighter: { value: '#FFEDEC' },
            dim: { value: '#270005' },
          },
        },
      },
      shadows: {
        sm: { value: '0 0 4px 0 #0000004D' },
        md: { value: '0 0 8px 0 #0000004D' },
      },
      fonts: {
        sans: {
          value:
            'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        },
      },
      fontSizes: {
        h1: { value: '6rem' },
        h2: { value: '3.75rem' },
        h3: { value: '3rem' },
        h4: { value: '2.125rem' },
        h5: { value: '1.5rem' },
        h6: { value: '1.25rem' },
        tiny: { value: '0.625rem' },
        xs: { value: '0.75rem' },
        sm: { value: '0.875rem' },
        md: { value: '1rem' },
        lg: { value: '1.125rem' },
      },
      fontWeights: {
        semiBold: { value: 600 },
        medium: { value: 500 },
        regular: { value: 400 },
      },
      lineHeights: {
        h1: { value: '5.75rem' },
        h2: { value: '3.5rem' },
        h3: { value: '3.25rem' },
        h4: { value: '2.5rem' },
        h5: { value: '2rem' },
        h6: { value: '1.5rem' },
        tiny: { value: '1rem' },
        xs: { value: '1rem' },
        sm: { value: '1.25rem' },
        md: { value: '1.5rem' },
      },
      radii: {
        '0': { value: '0.25rem' },
        '1': { value: '0.5rem' },
        '2': { value: '0.75rem' },
        '3': { value: '1rem' },
        '4': { value: '1.5rem' },
        round: { value: '100rem' },
      },
      spacing: {
        0: { value: '0rem' },
        xs: { value: '0.5rem' },
        sm: { value: '0.75rem' },
        md: { value: '1rem' },
        lg: { value: '1.25rem' },
        xl: { value: '2.25rem' },
        px: { value: '1px' },
        1: { value: '0.125rem' },
        2: { value: '0.25rem' },
        3: { value: '0.375rem' },
        4: { value: '0.5rem' },
        5: { value: '0.625rem' },
        6: { value: '0.75rem' },
        7: { value: '0.875rem' },
        8: { value: '1rem' },
        9: { value: '1.25rem' },
        10: { value: '1.5rem' },
        11: { value: '1.75rem' },
        12: { value: '2rem' },
        13: { value: '2.25rem' },
        14: { value: '2.5rem' },
        15: { value: '2.75rem' },
        16: { value: '3rem' },
        17: { value: '3.5rem' },
        18: { value: '4rem' },
        19: { value: '4.25rem' },
        20: { value: '5rem' },
        24: { value: '6rem' },
        28: { value: '7rem' },
        32: { value: '8rem' },
        36: { value: '9rem' },
        40: { value: '10rem' },
        44: { value: '11rem' },
        48: { value: '12rem' },
        52: { value: '13rem' },
        56: { value: '14rem' },
        60: { value: '15rem' },
        64: { value: '16rem' },
        72: { value: '18rem' },
        80: { value: '20rem' },
        96: { value: '24rem' },
        100: { value: '25rem' },
      },
      borderWidths: {
        light: { value: '1px' },
        normal: { value: '2px' },
        bold: { value: '3px' },
        extrabold: { value: '4px' },
        black: { value: '5px' },
      },
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },

  // Conditions (media queries)
  conditions: {
    extend: {
      allowMotion: '@media (prefers-reduced-motion: no-preference)',
      sm: '@media (max-width: 640px)',
      md: '@media (max-width: 768px)',
      lg: '@media (max-width: 1024px)',
      xl: '@media (max-width: 1280px)',
      '2xl': '@media (max-width: 1536px)',
      ls: '@media (max-width: 1024px) and (orientation: landscape)',
    },
  },

  // CSS generation
  jsxFramework: 'react',

  // Prefix for generated classes
  prefix: 'hms-ui',

  // Global CSS
  globalCss: {
    '.hms-ui-root *': {
      fontFamily: 'sans',
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
    '#hls-viewer-dark:fullscreen': {
      backgroundColor: 'black !important',
    },
    '#hls-viewer-light:fullscreen': {
      backgroundColor: 'white !important',
    },
  },
});
