import { useTheme } from '../baseComponents';

export const useDropdownSelection = () => {
  const { themeType } = useTheme();
  return themeType === 'dark' ? '$primaryDark' : '$grayLight';
};
