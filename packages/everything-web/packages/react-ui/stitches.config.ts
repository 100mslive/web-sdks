import { createStitches } from '@stitches/react';



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
            grey7: '#F2F2F2'
        },
        fonts: {
            sans: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif'
        }
    }
});

export const { theme, createTheme, styled, globalCss } = HmsStitches

export default HmsStitches