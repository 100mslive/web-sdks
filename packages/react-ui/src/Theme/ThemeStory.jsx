import React from 'react';
import { ColorItem, ColorPalette } from '@storybook/addon-docs';

const ThemeStory = () => {
  return (
    <ColorPalette>
      <ColorItem
        title="theme.color.brand"
        subtitle="Brand Variants"
        colors={{ brandLight: '#74AAFF', brandDefault: '#2F80FF', brandDark: '#0B326F', brandDisabled: '#D8E7FF' }}
      />
      <ColorItem
        title="theme.color.text"
        subtitle="Text Variants"
        colors={{
          textHighEmp: 'rgba(250, 252, 255, 0.9)',
          textMedEmp: 'rgba(215, 227, 245, 0.8)',
          textDisabled: 'rgba(164, 176, 193, 0.5)',
          textMedWhite: 'rgba(255, 255, 255, 0.72)',
          textDarkWhite: 'rgba(255, 255, 255, 0.48)',
        }}
      />
      <ColorItem
        title="theme.color.surface"
        subtitle="Surface Variants"
        colors={{
          surfaceDarker: '#06080A',
          surfaceDark: '#080B0F',
          surfaceDefault: '#0B0F15',
          surfaceLight: '#12161C',
          surfaceLighter: '#1F2228',
        }}
      />
      <ColorItem
        title="theme.color.primary"
        subtitle="Primary Variants"
        colors={{
          primaryLight: '#6DA6FF',
          primaryDefault: '#2F80FF',
          primaryDark: '#184080',
          primaryDisabled: '#D8E7FF',
        }}
      />
      <ColorItem
        title="theme.color.secondary"
        subtitle="Secondary Variants"
        colors={{
          secondaryLight: '#505863',
          secondaryDefault: '#657080',
          secondaryDark: '#1E2329',
          secondaryDisabled: '#DCE4EF',
        }}
      />
    </ColorPalette>
  );
};

export default ThemeStory;
