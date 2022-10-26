import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { theme, createTheme } from './stitches.config';
import type { Theme } from './stitches.config';
import { useMedia } from 'react-use';

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

  const lightTheme = useMemo(
    () => createTheme({ themeType: ThemeTypes.light, theme: userTheme || {} }),
    [userTheme],
  );

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

  useLayoutEffect(() => {
    if (themeType) {
      if (typeof window !== "undefined") {
        if (currentTheme === ThemeTypes.light) {
          document.documentElement.classList.remove(lightTheme.className);
        }

        if (themeType === ThemeTypes.light) {
          document.documentElement.classList.add(lightTheme.className);
        }
      }
      setCurrentTheme(themeType);
    }
  }, [themeType]);

  return (
    <ThemeContext.Provider
      value={{
        themeType: currentTheme,
        theme: currentTheme === ThemeTypes.light ? (lightTheme as unknown as Theme) : theme,
        aspectRatio,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
