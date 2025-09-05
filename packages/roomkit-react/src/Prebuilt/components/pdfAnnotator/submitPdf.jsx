import React from 'react';
import { Button, Flex } from '../../../';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA } from '../../common/constants';

export const SubmitPDF = ({ pdfFile, onOpenChange }) => {
  const [, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);

  return (
    <Flex
      direction="row"
      css={{
        mb: '0',
        mt: 'auto',
        gap: '8',
      }}
    >
      <Button
        variant="standard"
        outlined
        type="submit"
        onClick={() => {
          onOpenChange(false);
        }}
        css={{ w: '50%' }}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        onClick={() => {
          if (pdfFile) {
            setPDFConfig(pdfFile);
            onOpenChange(false);
          }
        }}
        disabled={!pdfFile}
        data-testid="share_pdf_btn"
        css={{
          w: '50%',
        }}
      >
        Start Sharing
      </Button>
    </Flex>
  );
};
