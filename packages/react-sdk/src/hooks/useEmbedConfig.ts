import { useCallback } from 'react';
import { selectAppData } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { validPDFUrl } from '../utils/commons';

export enum EmbedType {
  PDF = 'pdf',
  EMBED = 'embed',
}
export interface PDFData {
  type: EmbedType.PDF;
  data: File | string;
}

export interface EmbedData {
  type: EmbedType.EMBED;
  data: string;
}
export interface EmbedConfig {
  config: PDFData | EmbedData;
  isSharing?: boolean;
}
export interface useEmbedConfigResult {
  /**
   * embed Config data
   */
  embedConfig: EmbedConfig;

  /**
   * set pdf config data
   */
  setEmbedConfig: (value: EmbedConfig) => void;

  /**
   * reset the Embed config data
   */
  resetEmbedConfig: () => void;
}

export const useEmbedConfig = (): useEmbedConfigResult => {
  const actions = useHMSActions();
  const embedConfig = useHMSStore(selectAppData('embedConfig'));
  const setEmbedConfig = useCallback(
    async (value: EmbedConfig) => {
      // priority file first then url
      if (value.config.type === EmbedType.EMBED) {
        actions.setAppData('embedConfig', value);
        return;
      }
      if (typeof value.config.data === 'string') {
        await validPDFUrl(value.config.data);
      }
      actions.setAppData('embedConfig', value);
    },
    [actions],
  );
  const resetEmbedConfig = useCallback(() => {
    actions.setAppData('embedConfig', {});
  }, [actions]);

  return {
    embedConfig,
    setEmbedConfig,
    resetEmbedConfig,
  };
};
