import { useTheme } from "../base-components";

export const useDropdownSelection = () => {
  const { themeType } = useTheme();
  return themeType === "dark" ? "$primaryDark" : "$grayLight";
};
