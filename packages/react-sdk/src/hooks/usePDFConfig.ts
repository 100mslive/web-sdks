import { useCallback } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

export interface PDFConfig {
  file?: File;
  url?: string;
  isSharingPDF?: boolean;
}
export interface usePDFConfigResult {
  /**
   * pdf Config data
   */
  pdfConfig: PDFConfig;

  /**
   * set pdf config data
   */
  setPDFConfig: () => void;

  /**
   * reset the pdf config data
   */
  resetPDFConfig: () => void;
}

export const usePDFConfig = (): usePDFConfigResult => {
  const actions = useHMSActions();
  const pdfConfig = useHMSStore(selectAppData('pdfConfig'));
  const setPDFConfig = useCallback(
    (value: PDFConfig = {}) => {
      actions.setAppData('pdfConfig', value);
    },
    [actions],
  );
  const resetPDFConfig = useCallback(() => {
    actions.setAppData('pdfConfig', {});
  }, [actions]);

  return {
    pdfConfig,
    setPDFConfig,
    resetPDFConfig,
  };
};
