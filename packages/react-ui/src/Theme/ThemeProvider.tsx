import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import type { Theme } from './stitches.config';
import { createTheme, theme } from './stitches.config';
import useSSR from './useSSR';

const defaultAspectRatio = {
  width: 1,
  height: 1,
};

export enum ThemeTypes {
  light = 'light',
  dark = 'dark',
}

export type ThemeContextValue = {
  themeType: ThemeTypes;
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
  themeType?: ThemeTypes;
  theme?: Theme;
  aspectRatio?: { width: number; height: number };
};

const defaultContext = {
  themeType: ThemeTypes.dark,
  theme,
  aspectRatio: { width: 1, height: 1 },
  toggleTheme: (_themeToUpdateTo?: ThemeTypes) => {
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
  const systemTheme = useMedia('prefers-color-scheme: dark') ? ThemeTypes.dark : ThemeTypes.light;
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

  const toggleTheme = useCallback(
    (themeToUpdateTo?: ThemeTypes) => {
      if (themeToUpdateTo) {
        setCurrentTheme(themeToUpdateTo);
        return;
      }
      setCurrentTheme(currentTheme === ThemeTypes.dark ? ThemeTypes.light : ThemeTypes.dark);
    },
    [currentTheme],
  );

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
