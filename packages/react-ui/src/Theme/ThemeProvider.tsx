import React, { useMemo, useRef } from 'react';
import { theme, createTheme } from './stitches.config';
import type { Theme } from './stitches.config';

export type ThemeContextValue = {
  themeType: 'dark' | 'light';
  theme: Theme;
  aspectRatio: { width: number; height: number };
  avatarSalt?: number;
};
export type ThemeProviderProps = {
  themeType: 'dark' | 'light';
  theme?: Theme;
  aspectRatio: { width: number; height: number };
  avatarSalt?: number;
};

const defaultContext = { themeType: 'dark', theme, aspectRatio: { width: 1, height: 1 }, avatarSalt: 0 };
export const ThemeContext = React.createContext(defaultContext);

/**
 * Wrap this around your root component to get access to theme
 * eg:
 * <ThemeProvider type="dark" appBuilder={{ aspectRatio: { width:1, height: 1} }}>
 *  <App />
 * </ThemeProvider>
 */
export const HMSThemeProvider: React.FC<React.PropsWithChildren<ThemeProviderProps>> = ({
  themeType,
  theme: userTheme,
  aspectRatio,
  avatarSalt = 0,
  children,
}) => {
  const previousClassName = useRef('');
  const updatedTheme = useMemo(() => {
    const updatedTheme = createTheme({ themeType, theme: userTheme || {} });
    if (previousClassName.current) {
      document.documentElement.classList.remove(previousClassName.current);
    }
    previousClassName.current = updatedTheme.className;
    document.documentElement.classList.add(updatedTheme);
    return updatedTheme;
  }, [userTheme, themeType]);
  return (
    <ThemeContext.Provider value={{ themeType, theme: updatedTheme as unknown as Theme, aspectRatio, avatarSalt }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
