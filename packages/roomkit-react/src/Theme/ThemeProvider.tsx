import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Theme } from './stitches.config';
import { createTheme, theme } from './stitches.config';
import useSSR from './useSSR';

const defaultAspectRatio = {
  width: 1,
  height: 1,
};

export enum ThemeTypes {
  // eslint-disable-next-line no-unused-vars
  default = 'default',
}

export type ThemeContextValue = {
  themeType: string;
  theme: Theme;
  aspectRatio: { width: number; height: number };
  /**
   * @param {ThemeTypes} themeToUpdateTo - optional
   * Use this to toggle or update the currentTheme.
   * if a param is passed, it will set the theme to passed value, otherwise will toggle between light and dark
   * depending on current applied theme
   */
  toggleTheme: (themeToUpdateTo?: ThemeTypes) => void;
};

export type ThemeProviderProps = {
  themeType?: string;
  theme?: Theme;
  aspectRatio?: { width: number; height: number };
  /**
   * A container to apply the theme class to
   */
  container?: string;
};

const defaultContext = {
  themeType: ThemeTypes.default,
  theme,
  aspectRatio: { width: 1, height: 1 },
  toggleTheme: (_themeToUpdateTo?: ThemeTypes) => {
    return;
  },
};
export const ThemeContext = React.createContext<ThemeContextValue>(defaultContext);

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
  container,
}) => {
  const systemTheme = ThemeTypes.default;
  const [currentTheme, setCurrentTheme] = useState(themeType || systemTheme);
  const previousClassName = useRef('');
  const { isBrowser } = useSSR();
  const updatedTheme = useMemo(() => {
    const updatedTheme = createTheme({ themeType: currentTheme, theme: userTheme || {} });
    if (!isBrowser) {
      return updatedTheme;
    }
    const element = container ? document.querySelector(container) : document.documentElement;
    if (!element) {
      return updatedTheme;
    }
    if (previousClassName.current) {
      element.classList.remove(previousClassName.current);
    }
    previousClassName.current = updatedTheme.className;
    element.classList.add(updatedTheme);
    return updatedTheme;
  }, [userTheme, currentTheme, isBrowser, container]);

  const toggleTheme = useCallback((themeToUpdateTo?: ThemeTypes) => {
    if (themeToUpdateTo) {
      setCurrentTheme(themeToUpdateTo);
      return;
    }
    setCurrentTheme(ThemeTypes.default);
  }, []);

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
