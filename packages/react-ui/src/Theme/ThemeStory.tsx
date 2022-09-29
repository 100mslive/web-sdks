import React from 'react';
import { ColorPalette, ColorItem } from '@storybook/addon-docs';
import { baseConfig } from './base.config';

const ThemeStory = () => {
  const {
    brandLight,
    brandDefault,
    brandDark,
    brandDisabled,
    textHighEmp,
    textMedEmp,
    textDisabled,
    surfaceDark,
    surfaceDefault,
    surfaceLight,
    surfaceLighter,
    primaryLight,
    primaryDefault,
    secondaryDark,
    secondaryDefault,
    secondaryLight,
    secondaryDisabled,
  } = baseConfig.theme.colors;
  return (
    <ColorPalette>
      <ColorItem
        title="theme.color.brand"
        subtitle="Brand Variants"
        colors={{ brandLight, brandDefault, brandDark, brandDisabled }}
      />
      <ColorItem
        title="theme.color.text"
        subtitle="Text Variants"
        colors={{
          textHighEmp,
          textMedEmp,
          textDisabled,
          textMedWhite: "rgba(255, 255, 255, 0.72)",
          textDarkWhite: "rgba(255, 255, 255, 0.48)",
        }}
      />
      <ColorItem
        title="theme.color.surface"
        subtitle="Surface Variants"
        colors={{
          surfaceDarker: '#06080A',
          surfaceDark,
          surfaceDefault,
          surfaceLight,
          surfaceLighter,
        }}
      />
      <ColorItem
        title="theme.color.primary"
        subtitle="Primary Variants"
        colors={{
          primaryLight,
          primaryDefault,
          primaryDark: '#184080',
          primaryDisabled: '#D8E7FF',
        }}
      />
      <ColorItem
        title="theme.color.secondary"
        subtitle="Secondary Variants"
        colors={{
          secondaryLight,
          secondaryDefault,
          secondaryDark,
          secondaryDisabled,
        }}
      />
    </ColorPalette>
  );
};

export default ThemeStory;
