import { useCallback } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { validPDFUrl } from '../utils/commons';

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
  setPDFConfig: (value: PDFConfig) => void;

  /**
   * reset the pdf config data
   */
  resetPDFConfig: () => void;
}

export const usePDFConfig = (): usePDFConfigResult => {
  const actions = useHMSActions();
  const pdfConfig = useHMSStore(selectAppData('pdfConfig'));
  const setPDFConfig = useCallback(
    async (value: PDFConfig = {}) => {
      // priority file first then url
      if (value.file && value.url) {
        value.url = '';
      }
      // validate url
      if (value.url) {
        await validPDFUrl(value.url);
      }
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
