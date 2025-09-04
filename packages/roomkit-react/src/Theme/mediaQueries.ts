// Media query breakpoints for responsive design
export const media = {
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
  '2xl': '(max-width: 1536px)',
  ls: '(orientation: landscape)',
} as const;

// Legacy config object for backward compatibility during migration
export const config = {
  media,
  theme: {
    colors: {},
    space: {},
    fonts: {},
    fontSizes: {},
    fontWeights: {},
    lineHeights: {},
    radii: {},
    shadows: {},
    zIndices: {},
  },
};
