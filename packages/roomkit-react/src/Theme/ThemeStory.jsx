import React from 'react';
import { ColorItem, ColorPalette } from '@storybook/addon-docs';

const ThemeStory = () => {
  return (
    <ColorPalette>
      <ColorItem
        title="theme.color.brand"
        subtitle="Brand Variants"
        colors={{ brandLight: '#74AAFF', primary_default: '#2F80FF', brandDark: '#0B326F', brandDisabled: '#D8E7FF' }}
      />
      <ColorItem
        title="theme.color.text"
        subtitle="Text Variants"
        colors={{
          on_surface_high: 'rgba(250, 252, 255, 0.9)',
          on_surface_medium: 'rgba(215, 227, 245, 0.8)',
          on_surface_low: 'rgba(164, 176, 193, 0.5)',
        }}
      />
      <ColorItem
        title="theme.color.surface"
        subtitle="Surface Variants"
        colors={{
          surface_dimmer: '#06080A',
          surface_dim: '#080B0F',
          surface_default: '#0B0F15',
          surface_bright: '#12161C',
          surface_brighter: '#1F2228',
        }}
      />
      <ColorItem
        title="theme.color.primary"
        subtitle="Primary Variants"
        colors={{
          primary_bright: '#6DA6FF',
          primary_default: '#2F80FF',
          primary_dim: '#184080',
          primary_disabled: '#D8E7FF',
        }}
      />
      <ColorItem
        title="theme.color.secondary"
        subtitle="Secondary Variants"
        colors={{
          secondary_bright: '#505863',
          secondary_default: '#657080',
          secondary_dim: '#1E2329',
          secondary_disabled: '#DCE4EF',
        }}
      />
    </ColorPalette>
  );
};

export default ThemeStory;
