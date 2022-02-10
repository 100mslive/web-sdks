import React from 'react';
import { theme } from './stitches.config';
import type { Theme } from './stitches.config';

export type AppBuilder = {
  aspectRatio: { width: number; height: number };
};
export type ThemeContextValue = { type: 'dark' | 'light'; theme: Theme; appBuilder: AppBuilder };
export type ThemeProviderProps = ThemeContextValue;

const defaultContext = { type: 'dark', theme, appBuilder: { aspectRatio: { width: 1, height: 1 } } };
export const ThemeContext = React.createContext(defaultContext);

/**
 * Wrap this around your root component to get access to theme
 * eg:
 * <ThemeProvider type="dark" theme={} appBuilder={{ aspectRatio: { width:1, height: 1} }}>
 *  <App />
 * </ThemeProvider>
 */
export const ThemeProvider: React.FC<React.PropsWithChildren<ThemeProviderProps>> = ({
  type,
  theme,
  appBuilder,
  children,
}) => {
  return <ThemeContext.Provider value={{ type, theme, appBuilder }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => React.useContext(ThemeContext);
