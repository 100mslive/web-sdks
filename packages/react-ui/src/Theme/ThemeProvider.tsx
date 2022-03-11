import React, { useEffect, useRef, useState } from 'react';
import { theme, createTheme } from './stitches.config';
import type { Theme } from './stitches.config';
import useSSR from './useSSR';

export type ThemeContextValue = {
  themeType: 'dark' | 'light';
  theme: Theme;
  aspectRatio: { width: number; height: number };
};
export type ThemeProviderProps = {
  themeType: 'dark' | 'light';
  theme?: Theme;
  aspectRatio: { width: number; height: number };
};

const defaultContext = { themeType: 'dark', theme, aspectRatio: { width: 1, height: 1 } };
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
  children,
}) => {
  const previousClassName = useRef('');
  const [updatedTheme, setTheme] = useState(createTheme({ themeType, theme: userTheme || {} }));
  const { isBrowser } = useSSR();

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    const updatedTheme = createTheme({ themeType, theme: userTheme || {} });
    if (previousClassName.current) {
      document.documentElement.classList.remove(previousClassName.current);
    }
    previousClassName.current = updatedTheme.className;
    document.documentElement.classList.add(updatedTheme);
    setTheme(updatedTheme);
  }, [isBrowser, userTheme, themeType]);
  return (
    <ThemeContext.Provider value={{ themeType, theme: updatedTheme as unknown as Theme, aspectRatio }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
