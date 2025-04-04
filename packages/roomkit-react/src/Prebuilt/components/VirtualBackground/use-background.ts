import { useLocalStorage } from 'react-use';
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background';
import { APP_DATA } from '../../common/constants';

export function useBackground() {
  const [background, setBackground] = useLocalStorage<
    | { type: HMSVirtualBackgroundTypes.BLUR; blurAmount: number }
    | { type: HMSVirtualBackgroundTypes.IMAGE; mediaURL: string }
    | { type: HMSVirtualBackgroundTypes.NONE }
  >(`hms-${APP_DATA.background}`);

  return [background || { type: HMSVirtualBackgroundTypes.NONE }, setBackground] as const;
}
