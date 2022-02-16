import React, { useMemo, useRef } from 'react';
import { theme, createTheme } from './stitches.config';
import type { Theme } from './stitches.config';

export type AppBuilder = {
  aspectRatio: { width: number; height: number };
};
export type ThemeContextValue = { type: 'dark' | 'light'; theme: Theme; appBuilder: AppBuilder };
export type ThemeProviderProps = { type: 'dark' | 'light'; theme?: Theme; appBuilder: AppBuilder };

const defaultContext = { type: 'dark', theme, appBuilder: { aspectRatio: { width: 1, height: 1 } } };
export const ThemeContext = React.createContext(defaultContext);

/**
 * Wrap this around your root component to get access to theme
 * eg:
 * <ThemeProvider type="dark" appBuilder={{ aspectRatio: { width:1, height: 1} }}>
 *  <App />
 * </ThemeProvider>
 */
export const HMSThemeProvider: React.FC<React.PropsWithChildren<ThemeProviderProps>> = ({
  type,
  theme: userTheme,
  appBuilder,
  children,
}) => {
  const previousClassName = useRef('');
  const updatedTheme = useMemo(() => {
    const updatedTheme = createTheme({ type, theme: userTheme || {} });
    if (previousClassName.current) {
      document.documentElement.classList.remove(previousClassName.current);
    }
    previousClassName.current = updatedTheme.className;
    document.documentElement.classList.add(updatedTheme);
    return updatedTheme;
  }, [userTheme, type]);
  return (
    <ThemeContext.Provider value={{ type, theme: updatedTheme as unknown as Theme, appBuilder }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
