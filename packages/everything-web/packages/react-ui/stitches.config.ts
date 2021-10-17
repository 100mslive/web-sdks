import { createStitches } from '@stitches/react';
import type * as Stitches from '@stitches/core';

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
            black: '#000',
            white: '#FFF',
            grey1: '#212121',
            grey2: '#3B3B3B',
            grey3: '#5E5E5E',
            grey4: '#8E8E8E',
            grey5: '#C7C7C7',
            grey6: '#E3E3E3',
            grey7: '#F2F2F2',
            trans: 'rgba(255, 255, 255, 0.25)'
        },
        fonts: {
            sans: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif'
        },
    },
    utils: {
        p: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingTop: value,
          paddingBottom: value,
          paddingLeft: value,
          paddingRight: value,
        }),
        pt: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingTop: value,
        }),
        pr: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingRight: value,
        }),
        pb: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingBottom: value,
        }),
        pl: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingLeft: value,
        }),
        px: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingLeft: value,
          paddingRight: value,
        }),
        py: (value: Stitches.PropertyValue<'paddingTop'>) => ({
          paddingTop: value,
          paddingBottom: value,
        }),
        m: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginTop: value,
          marginBottom: value,
          marginLeft: value,
          marginRight: value,
        }),
        mt: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginTop: value,
        }),
        mr: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginRight: value,
        }),
        mb: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginBottom: value,
        }),
        ml: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginLeft: value,
        }),
        mx: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginLeft: value,
          marginRight: value,
        }),
        my: (value: Stitches.PropertyValue<'marginTop'>) => ({
          marginTop: value,
          marginBottom: value,
        }),
        size: (value: Stitches.PropertyValue<'width'>) => ({
          width: value,
          height: value,
        }),
        bc: (value: Stitches.PropertyValue<'backgroundColor'>) => ({
          backgroundColor: value,
        }),
      },
});

export const { theme, createTheme, styled, globalCss , keyframes } = HmsStitches

export default HmsStitches