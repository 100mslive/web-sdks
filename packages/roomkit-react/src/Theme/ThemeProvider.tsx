import React, { useCallback, useEffect, useState } from 'react';
import useSSR from './useSSR';

const defaultAspectRatio = {
  width: 1,
  height: 1,
};

export enum ThemeTypes {
  // eslint-disable-next-line no-unused-vars
  default = 'default',
}

export type Theme = {
  themeType: string;
  [key: string]: any;
};

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
};

const defaultTheme: Theme = {
  themeType: ThemeTypes.default,
};

const defaultContext = {
  themeType: ThemeTypes.default,
  theme: defaultTheme,
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
}) => {
  const systemTheme = ThemeTypes.default;
  const [currentTheme, setCurrentTheme] = useState(themeType || systemTheme);
  useSSR();

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

  const theme = userTheme || defaultTheme;

  return (
    <ThemeContext.Provider value={{ themeType: currentTheme, theme, aspectRatio, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
