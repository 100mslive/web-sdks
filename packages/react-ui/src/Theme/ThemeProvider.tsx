import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { theme, createTheme } from './stitches.config';
import type { Theme } from './stitches.config';
import useSSR from './useSSR';
import { useMedia } from 'react-use';

const defaultAspectRatio = {
  width: 1,
  height: 1,
};

export type ThemeContextValue = {
  themeType: 'dark' | 'light';
  theme: Theme;
  aspectRatio: { width: number; height: number };
  toggleTheme: () => void;
};

export type ThemeProviderProps = {
  themeType?: 'dark' | 'light';
  theme?: Theme;
  aspectRatio?: { width: number; height: number };
  toggleTheme: () => void;
};

const defaultContext = {
  themeType: 'dark',
  theme,
  aspectRatio: { width: 1, height: 1 },
  toggleTheme: () => {
    return;
  },
};
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
  aspectRatio = defaultAspectRatio,
  children,
}) => {
  const systemTheme = useMedia('prefers-color-scheme: dark') ? 'dark' : 'light';
  const [currentTheme, setCurrentTheme] = useState(themeType || systemTheme);
  const previousClassName = useRef('');
  const { isBrowser } = useSSR();
  const updatedTheme = useMemo(() => {
    const updatedTheme = createTheme({ themeType: currentTheme, theme: userTheme || {} });
    if (!isBrowser) {
      return updatedTheme;
    }
    if (previousClassName.current) {
      document.documentElement.classList.remove(previousClassName.current);
    }
    previousClassName.current = updatedTheme.className;
    document.documentElement.classList.add(updatedTheme);
    return updatedTheme;
  }, [userTheme, currentTheme, isBrowser]);

  const toggleTheme = useCallback(() => {
    setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [currentTheme]);

  useEffect(() => {
    if (themeType) {
      setCurrentTheme(themeType);
    }
  }, [themeType]);

  return (
    <ThemeContext.Provider
      value={{ themeType: currentTheme, theme: updatedTheme as unknown as Theme, aspectRatio, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
