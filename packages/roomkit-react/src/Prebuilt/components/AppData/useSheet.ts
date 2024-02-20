import { useCallback } from 'react';
import { selectAppData, useHMSActions, useHMSStore, useHMSVanillaStore } from '@100mslive/react-sdk';
import { APP_DATA } from '../../common/constants';

export const useIsSheetTypeOpen = (sheetType: string) => {
  if (!sheetType) {
    throw Error('Pass one of the sheet options');
  }
  return useHMSStore(selectAppData(APP_DATA.sheet)) === sheetType;
};

export const useSheetState = () => {
  const sheet = useHMSStore(selectAppData(APP_DATA.sheet));
  return sheet;
};

export const useSheetToggle = (sheetType: string) => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const toggleSheet = useCallback(() => {
    const isOpen = vanillaStore.getState(selectAppData(APP_DATA.sheet)) === sheetType;
    hmsActions.setAppData(APP_DATA.sheet, !isOpen ? sheetType : '');
  }, [vanillaStore, hmsActions, sheetType]);
  return toggleSheet;
};

export const useSheetReset = () => {
  const hmsActions = useHMSActions();
  const resetSheet = useCallback(() => {
    hmsActions.setAppData(APP_DATA.sheet, '');
  }, [hmsActions]);
  return resetSheet;
};
