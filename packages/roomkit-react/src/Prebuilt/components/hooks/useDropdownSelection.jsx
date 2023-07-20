import { useTheme } from '../../../';

export const useDropdownSelection = () => {
  const { themeType } = useTheme();
  return themeType === 'dark' ? '$primaryDark' : '$grayLight';
};
