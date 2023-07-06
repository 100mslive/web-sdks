import { useCallback } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

export const usePDFConfig = () => {
  const actions = useHMSActions();
  const pdfConfig = useHMSStore(selectAppData('pdfConfig'));
  const setValue = useCallback(
    (value: { file?: File; url?: string; isSharingPDF?: boolean } = {}) => {
      console.log({ value });
      actions.setAppData('pdfConfig', value);
    },
    [actions],
  );
  const resetValue = useCallback(() => {
    actions.setAppData('pdfConfig', {});
  }, [actions]);

  return {
    pdfConfig,
    setValue,
    resetValue,
  };
};
